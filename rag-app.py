import streamlit as st
from google import genai
from google.genai import types
import os
import time
import tempfile
import datetime
import pandas as pd
import fitz  # PyMuPDF

# ==========================================
# 설정
# ==========================================
CONFIG_FILE = "store_config.json"

st.set_page_config(
    page_title="📚 RAG 문서 챗봇",
    page_icon="🤖",
    layout="wide"
)

# ==========================================
# 로컬 파일 목록 관리 (JSON)
# ==========================================
import json

def load_config():
    """로컬 설정 파일 로드 (파일 목록용)"""
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_file_list(store_id, files):
    """Store별 파일 목록 저장"""
    config = load_config()
    config[store_id] = files
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=4)

def get_file_list(store_id):
    """Store의 파일 목록 가져오기"""
    config = load_config()
    return config.get(store_id, [])

def delete_file_list(store_id):
    """Store의 파일 목록 삭제"""
    config = load_config()
    if store_id in config:
        del config[store_id]
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=4)

# ==========================================
# Store 관리 함수 (API 기반 - 로컬 파일 불필요)
# ==========================================

def get_existing_stores(client):
    """API 키에 연결된 모든 Store 목록 조회"""
    try:
        stores = list(client.file_search_stores.list())
        return stores
    except Exception as e:
        st.error(f"Store 목록 조회 실패: {e}")
        return []

def is_scanned_pdf(pdf_path):
    """스캔 PDF인지 확인"""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc[:3]:
            text += page.get_text()
        doc.close()
        return len(text.strip()) < 100
    except:
        return False

# ==========================================
# PDF 전처리 엔진
# ==========================================

def convert_with_pymupdf4llm(pdf_path):
    """pymupdf4llm으로 마크다운 변환 (빠름)"""
    try:
        import pymupdf4llm
        return pymupdf4llm.to_markdown(pdf_path)
    except ImportError:
        st.error("pymupdf4llm이 설치되지 않았습니다. `pip install pymupdf4llm`")
        return None
    except Exception as e:
        st.error(f"pymupdf4llm 변환 실패: {e}")
        return None

def convert_with_docling(pdf_path):
    """Docling으로 마크다운 변환 (정확함, 느림)"""
    try:
        from docling.document_converter import DocumentConverter
        converter = DocumentConverter()
        result = converter.convert(pdf_path)
        return result.document.export_to_markdown()
    except ImportError:
        st.error("Docling이 설치되지 않았습니다. `pip install docling`")
        return None
    except Exception as e:
        st.error(f"Docling 변환 실패: {e}")
        return None

def convert_with_gemini_vision(client, pdf_path, model="gemini-2.0-flash"):
    """스캔 PDF → Gemini Vision으로 추출"""
    try:
        from pdf2image import convert_from_path
        import io
        
        images = convert_from_path(pdf_path, dpi=150)
        all_content = []
        
        for i, img in enumerate(images):
            st.toast(f"📷 페이지 {i+1}/{len(images)} Vision 처리 중...")
            
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)
            image_bytes = buffer.read()
            
            response = client.models.generate_content(
                model=model,
                contents=[
                    {"mime_type": "image/png", "data": image_bytes},
                    """이 페이지를 마크다운으로 변환해주세요.
규칙:
- 표는 마크다운 표 형식으로 정확히 변환
- 숫자와 단위를 정확하게 추출
- 일반 텍스트도 포함
- 한국어로 작성"""
                ]
            )
            all_content.append(f"## 페이지 {i+1}\n\n{response.text}")
        
        return "\n\n---\n\n".join(all_content)
    
    except ImportError:
        st.error("pdf2image가 설치되지 않았습니다. `pip install pdf2image`")
        return None
    except Exception as e:
        st.error(f"Gemini Vision 처리 실패: {e}")
        return None

def convert_excel_to_markdown(file_path):
    """엑셀 → 마크다운 변환"""
    try:
        xls = pd.read_excel(file_path, sheet_name=None)
        text_output = ""
        for sheet_name, df in xls.items():
            if df.empty:
                continue
            text_output += f"\n\n## 엑셀 시트: {sheet_name}\n\n"
            text_output += df.fillna("").to_markdown(index=False)
        return text_output
    except Exception as e:
        st.error(f"엑셀 변환 실패: {e}")
        return None

# ==========================================
# File Search Store 관련
# ==========================================

def wait_for_operation(client, operation, timeout=300):
    """비동기 작업 완료 대기"""
    start_time = time.time()
    while not operation.done:
        if time.time() - start_time > timeout:
            raise TimeoutError("작업 시간 초과 (5분)")
        time.sleep(3)
        operation = client.operations.get(operation)
    return operation

def upload_and_import_file(client, store_name, uploaded_file, preprocess_method, vision_model):
    """파일 전처리 후 File Search Store에 업로드"""
    suffix = os.path.splitext(uploaded_file.name)[1].lower()
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(uploaded_file.getvalue())
        tmp_path = tmp.name
    
    converted_content = None
    display_name = uploaded_file.name
    md_path = None
    
    try:
        # 1. 엑셀 파일
        if suffix in ['.xlsx', '.xls', '.xlsm']:
            st.toast(f"📊 엑셀 '{uploaded_file.name}' 변환 중...")
            converted_content = convert_excel_to_markdown(tmp_path)
            display_name = f"{uploaded_file.name} (표 최적화)"
        
        # 2. PDF 파일
        elif suffix == '.pdf':
            if is_scanned_pdf(tmp_path):
                st.toast(f"📷 스캔 PDF 감지 → Gemini Vision 사용")
                converted_content = convert_with_gemini_vision(client, tmp_path, vision_model)
                display_name = f"{uploaded_file.name} (Vision 추출)"
            else:
                if preprocess_method == "Docling (정확, 느림)":
                    st.toast(f"🔬 Docling으로 '{uploaded_file.name}' 변환 중...")
                    converted_content = convert_with_docling(tmp_path)
                else:
                    st.toast(f"⚡ pymupdf4llm으로 '{uploaded_file.name}' 변환 중...")
                    converted_content = convert_with_pymupdf4llm(tmp_path)
                display_name = f"{uploaded_file.name} (마크다운 변환)"
        
        # 3. 변환된 내용이 있으면 마크다운 파일로 저장
        if converted_content:
            md_path = tmp_path.replace(suffix, ".md")
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(converted_content)
            upload_path = md_path
            mime_type = "text/markdown"
        else:
            upload_path = tmp_path
            mime_type = "application/octet-stream"
        
        # 4. 파일 업로드
        file_obj = client.files.upload(
            file=upload_path,
            config={
                'mime_type': mime_type,
                'display_name': display_name
            }
        )
        time.sleep(2)
        
        # 5. File Search Store에 import
        import_operation = client.file_search_stores.import_file(
            file_search_store_name=store_name,
            file_name=file_obj.name
        )
        wait_for_operation(client, import_operation)
        
        return True, display_name
        
    except Exception as e:
        return False, str(e)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        if md_path and os.path.exists(md_path):
            os.remove(md_path)

# ==========================================
# 이미지 생성 함수
# ==========================================

def generate_visualization(client, content, image_model, caption="시각화 결과"):
    """내용을 기반으로 다이어그램 이미지 생성"""
    try:
        desc_resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""다음 내용을 시각화할 다이어그램 프롬프트를 만들어줘.
규칙:
- 텍스트 없이 도식만 표현
- 색상과 구성요소를 구체적으로 설명
- 영어로 작성 (이미지 생성 최적화)

내용:
{content}"""
        )
        
        img_resp = client.models.generate_content(
            model=image_model,
            contents=desc_resp.text
        )
        
        if img_resp.parts:
            for part in img_resp.parts:
                if part.inline_data:
                    return {
                        "role": "image",
                        "data": part.inline_data.data,
                        "caption": caption
                    }
        return None
        
    except Exception as e:
        st.error(f"이미지 생성 실패: {e}")
        return None

# ==========================================
# Streamlit UI
# ==========================================

# 세션 상태 초기화
if "history" not in st.session_state:
    st.session_state.history = []
if "client" not in st.session_state:
    st.session_state.client = None
if "current_store" not in st.session_state:
    st.session_state.current_store = None

# --- 사이드바 ---
with st.sidebar:
    st.header("⚙️ 설정")
    
    # API 키 입력
    api_key = st.text_input(
        "🔑 Gemini API 키",
        type="password",
        help="Google AI Studio에서 API 키를 발급받으세요"
    )
    
    if api_key:
        try:
            st.session_state.client = genai.Client(api_key=api_key)
            st.success("✅ API 연결됨")
        except Exception as e:
            st.error(f"API 연결 실패: {e}")
            st.session_state.client = None
    
    st.divider()
    
    # 모델 설정
    st.subheader("🤖 모델 설정")
    
    chat_model = st.selectbox(
        "채팅 모델",
        [
            "gemini-2.5-pro",
            "gemini-2.5-flash",
            "gemini-3-pro-preview",
            "gemini-3-flash-preview",
        ]
    )
    
    vision_model = st.selectbox(
        "Vision 모델 (스캔 PDF용)",
        ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"]
    )
    
    image_model = st.selectbox(
        "🎨 이미지 생성 모델",
        ["gemini-2.5-flash-image", "gemini-3-pro-image-preview"]
    )
    
    st.divider()
    
    # 전처리 방식 선택
    st.subheader("📄 PDF 전처리")
    preprocess_method = st.radio(
        "변환 엔진",
        ["pymupdf4llm (빠름)", "Docling (정확, 느림)"]
    )
    
    st.divider()
    
    # ========== Store 선택 (API 기반) ==========
    st.subheader("📁 문서 저장소")
    
    if st.session_state.client:
        # 기존 Store 목록 조회
        stores = get_existing_stores(st.session_state.client)
        
        if stores:
            store_options = {s.display_name or s.name: s.name for s in stores}
            store_options["➕ 새 저장소 만들기"] = None
            
            selected_display = st.selectbox(
                "저장소 선택",
                options=list(store_options.keys()),
                help="기존 저장소를 선택하거나 새로 만드세요"
            )
            
            selected_store = store_options[selected_display]
            st.session_state.current_store = selected_store
            
            if selected_store:
                # 로컬 JSON에서 파일 목록 가져오기
                file_list = get_file_list(selected_store)
                st.success(f"🟢 저장소 연결됨 ({len(file_list)}개 파일)")
                
                if file_list:
                    with st.expander("📂 파일 목록"):
                        for f in file_list:
                            st.text(f"• {f}")
        else:
            st.info("📭 저장소가 없습니다. 문서를 업로드하면 자동 생성됩니다.")
            st.session_state.current_store = None
    else:
        st.warning("🔑 API 키를 입력하세요")
    
    st.divider()
    
    if st.button("🗑️ 대화 내용 지우기", use_container_width=True):
        st.session_state.history = []
        st.rerun()

# --- 메인 패널 ---
st.title("🤖 RAG 문서 챗봇")
st.caption("PDF/엑셀을 마크다운으로 전처리하여 검색 품질을 높입니다 | v5.0 (클라우드 저장 + 파일 목록)")

# API 키 체크
if not st.session_state.client:
    st.info("👈 사이드바에서 Gemini API 키를 입력하세요")
    st.markdown("""
    ### 시작하기
    1. [Google AI Studio](https://aistudio.google.com/apikey)에서 API 키 발급
    2. 사이드바에 API 키 입력
    3. 문서 업로드 후 대화 시작!
    
    ### 💡 v3.0 새로운 기능
    - **자동 저장소 연결**: 같은 API 키로 접속하면 기존 문서 자동 연결
    - **클라우드 저장**: 앱 재시작해도 문서 유지
    - **저장소 선택**: 여러 저장소 중 선택 가능
    """)
    st.stop()

client = st.session_state.client
current_store_id = st.session_state.current_store

# 탭 구성
tab1, tab2, tab3 = st.tabs(["💬 채팅", "📤 문서 업로드", "🗑️ 저장소 관리"])

# --- 채팅 탭 ---
with tab1:
    if not current_store_id:
        st.info("📤 '문서 업로드' 탭에서 먼저 문서를 업로드하거나, 사이드바에서 저장소를 선택하세요")
    else:
        # 채팅 기록 표시
        for m in st.session_state.history:
            if m['role'] == 'image':
                with st.chat_message("ai"):
                    st.image(m['data'], caption=m.get('caption', ''))
            elif m['role'] in ['user', 'model']:
                role = "user" if m['role'] == 'user' else "ai"
                with st.chat_message(role):
                    st.markdown(m['parts'][0]['text'])
        
        # AI 응답 후 시각화 버튼 표시
        if st.session_state.history and st.session_state.history[-1]["role"] == "model":
            st.divider()
            col1, col2 = st.columns(2)
            
            with col1:
                if st.button("🎨 이 내용 시각화하기", use_container_width=True):
                    with st.spinner("이미지 생성 중..."):
                        last_text = st.session_state.history[-1]["parts"][0]["text"]
                        img_data = generate_visualization(
                            client, last_text, image_model, "답변 시각화"
                        )
                        if img_data:
                            st.session_state.history.append(img_data)
                            st.rerun()
            
            with col2:
                if st.button("🎨 전체 맥락 시각화하기", use_container_width=True):
                    with st.spinner("이미지 생성 중..."):
                        ctx = "\n".join([
                            f"{m['role']}: {m['parts'][0]['text']}" 
                            for m in st.session_state.history 
                            if m['role'] != 'image'
                        ])
                        img_data = generate_visualization(
                            client, ctx, image_model, "전체 맥락 시각화"
                        )
                        if img_data:
                            st.session_state.history.append(img_data)
                            st.rerun()
        
        # 사용자 입력
        if prompt := st.chat_input("질문을 입력하세요..."):
            st.session_state.history.append({
                "role": "user",
                "parts": [{"text": prompt}]
            })
            st.rerun()
        
        # AI 응답 생성
        if st.session_state.history and st.session_state.history[-1]["role"] == "user":
            with st.chat_message("ai"):
                msg_placeholder = st.empty()
                full_text = ""
                
                try:
                    file_search_config = types.FileSearch(
                        file_search_store_names=[current_store_id]
                    )
                    tools = [types.Tool(file_search=file_search_config)]
                    
                    system_instruction = """당신은 업로드된 문서를 분석하는 전문 AI입니다.

[문서 형식 안내]
- PDF와 엑셀 파일은 '마크다운 표' 형식으로 변환되어 제공됩니다.
- 표의 헤더(제목)와 셀 값을 정확하게 매칭하여 답변하세요.

[답변 규칙]
1. 질문과 관련된 표 데이터를 찾아 정확한 수치를 답변하세요.
2. 표가 다소 깨져 보이더라도 행과 열의 구조를 논리적으로 추론하세요.
3. 답변 시 마크다운 표를 적극 활용하여 가독성을 높이세요.
4. 한국어로 친절하게 답변하세요.
5. 문서에 없는 내용은 "문서에서 확인되지 않습니다"라고 답변하세요."""
                    
                    response = client.models.generate_content_stream(
                        model=chat_model,
                        contents=[m for m in st.session_state.history if m["role"] != "image"],
                        config=types.GenerateContentConfig(
                            tools=tools,
                            system_instruction=system_instruction
                        )
                    )
                    
                    for chunk in response:
                        if chunk.text:
                            full_text += chunk.text
                            msg_placeholder.markdown(full_text + "▌")
                    
                    msg_placeholder.markdown(full_text)
                    st.session_state.history.append({
                        "role": "model",
                        "parts": [{"text": full_text}]
                    })
                    st.rerun()
                    
                except Exception as e:
                    st.error(f"오류 발생: {e}")

# --- 문서 업로드 탭 ---
with tab2:
    st.subheader("📤 문서 업로드")
    
    if current_store_id:
        st.info("현재 저장소에 파일을 추가합니다")
    else:
        st.info("새 저장소를 생성하고 문서를 업로드합니다")
    
    uploaded_files = st.file_uploader(
        "PDF, 엑셀, 텍스트 파일 업로드",
        accept_multiple_files=True,
        type=['pdf', 'xlsx', 'xls', 'txt', 'md', 'csv', 'docx']
    )
    
    if uploaded_files:
        st.write(f"**선택된 파일: {len(uploaded_files)}개**")
        for f in uploaded_files:
            st.text(f"• {f.name} ({f.size / 1024:.1f} KB)")
        
        if st.button("🚀 업로드 시작", type="primary", use_container_width=True):
            try:
                # 저장소 생성 또는 기존 사용
                if current_store_id:
                    store_name = current_store_id
                else:
                    with st.spinner("저장소 생성 중..."):
                        new_store = client.file_search_stores.create(
                            config={'display_name': f'RAG_Store_{datetime.date.today()}'}
                        )
                        store_name = new_store.name
                        st.session_state.current_store = store_name
                
                # 파일 업로드
                progress_bar = st.progress(0)
                status_text = st.empty()
                
                success_files = []  # 성공한 파일명 저장
                failed_files = []
                
                for idx, uploaded_file in enumerate(uploaded_files):
                    progress_bar.progress((idx + 1) / len(uploaded_files))
                    status_text.info(f"📤 처리 중: {uploaded_file.name}")
                    
                    success, result = upload_and_import_file(
                        client=client,
                        store_name=store_name,
                        uploaded_file=uploaded_file,
                        preprocess_method=preprocess_method,
                        vision_model=vision_model
                    )
                    
                    if success:
                        success_files.append(result)  # 파일명 저장
                        status_text.success(f"✅ 완료: {uploaded_file.name}")
                    else:
                        failed_files.append(f"{uploaded_file.name}: {result}")
                        status_text.error(f"❌ 실패: {uploaded_file.name}")
                
                if success_files:
                    # 기존 파일 목록에 추가하여 JSON에 저장
                    existing_files = get_file_list(store_name)
                    all_files = existing_files + success_files
                    save_file_list(store_name, all_files)
                    st.success(f"🎉 {len(success_files)}개 파일 업로드 완료!")
                
                if failed_files:
                    with st.expander("❌ 실패한 파일"):
                        for f in failed_files:
                            st.text(f)
                
                time.sleep(1)
                st.rerun()
                
            except Exception as e:
                st.error(f"오류 발생: {e}")

# --- 저장소 관리 탭 ---
with tab3:
    st.subheader("🗑️ 저장소 관리")
    
    if current_store_id:
        st.warning("⚠️ 저장소를 삭제하면 모든 문서가 제거됩니다")
        
        with st.expander("현재 저장소 정보"):
            st.code(f"Store ID: {current_store_id}")
        
        if st.button("🔴 저장소 삭제", type="secondary"):
            try:
                with st.spinner("삭제 중..."):
                    client.file_search_stores.delete(
                        name=current_store_id,
                        config={'force': True}
                    )
                    delete_file_list(current_store_id)  # JSON에서도 삭제
                st.session_state.current_store = None
                st.success("✅ 삭제 완료")
                time.sleep(1)
                st.rerun()
            except Exception as e:
                st.error(f"삭제 실패: {e}")
    else:
        st.info("선택된 저장소가 없습니다")
    
    st.divider()
    
    # 모든 저장소 보기
    st.subheader("📋 전체 저장소 목록")
    
    if st.button("🔄 새로고침"):
        st.rerun()
    
    stores = get_existing_stores(client)
    if stores:
        for store in stores:
            col1, col2 = st.columns([3, 1])
            with col1:
                st.text(f"📁 {store.display_name or store.name}")
            with col2:
                if st.button("🗑️", key=f"del_{store.name}"):
                    try:
                        client.file_search_stores.delete(
                            name=store.name,
                            config={'force': True}
                        )
                        delete_file_list(store.name)  # JSON에서도 삭제
                        if st.session_state.current_store == store.name:
                            st.session_state.current_store = None
                        st.rerun()
                    except Exception as e:
                        st.error(f"삭제 실패: {e}")
    else:
        st.caption("저장소가 없습니다")

# --- 푸터 ---
st.divider()
st.caption("""
**v5.0 특징:**
- ☁️ 클라우드 저장: 같은 API 키로 접속하면 기존 Store 자동 연결
- 📂 파일 목록: 로컬 JSON에 저장하여 표시 (같은 기기에서만)
- 🔄 저장소 선택: 여러 저장소 중 선택 가능

**사용된 기술:**
- 🔍 Gemini File Search API (RAG)
- 📄 pymupdf4llm / Docling (PDF 전처리)
- 📷 Gemini Vision (스캔 PDF 처리)
- 🎨 Gemini Image Generation (시각화)
""")