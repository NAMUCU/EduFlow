/**
 * 수학 풀이 채점용 이미지 Diff 시스템
 * - 원본 문제지와 제출된 이미지를 비교하여 풀이 부분만 추출
 * - sharp 라이브러리를 사용한 이미지 처리
 */
import sharp from 'sharp'

export interface ImageDiffResult {
  diffImage: Buffer
  diffPercentage: number
  width: number
  height: number
}

export interface PreprocessedImage {
  data: Buffer
  width: number
  height: number
}

/**
 * 이미지 전처리 - 그레이스케일 변환 및 노이즈 제거
 * @param image 원본 이미지 버퍼
 * @returns 전처리된 이미지 버퍼
 */
export async function preprocessImage(image: Buffer): Promise<Buffer> {
  try {
    const processed = await sharp(image)
      // 그레이스케일 변환
      .grayscale()
      // 노이즈 제거를 위한 가우시안 블러 (약하게)
      .blur(0.5)
      // 대비 정규화 (콘트라스트 향상)
      .normalize()
      // 이진화를 위한 threshold 적용 (텍스트/필기 강조)
      .threshold(200)
      .toBuffer()

    return processed
  } catch (error) {
    console.error('이미지 전처리 실패:', error)
    throw new Error(`이미지 전처리 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  }
}

/**
 * 두 이미지의 크기를 맞춤
 * @param image1 첫 번째 이미지
 * @param image2 두 번째 이미지
 * @returns 크기가 맞춰진 두 이미지
 */
async function normalizeImageSizes(
  image1: Buffer,
  image2: Buffer
): Promise<{ img1: Buffer; img2: Buffer; width: number; height: number }> {
  const metadata1 = await sharp(image1).metadata()
  const metadata2 = await sharp(image2).metadata()

  if (!metadata1.width || !metadata1.height || !metadata2.width || !metadata2.height) {
    throw new Error('이미지 메타데이터를 읽을 수 없습니다')
  }

  // 더 큰 이미지 크기에 맞춤
  const width = Math.max(metadata1.width, metadata2.width)
  const height = Math.max(metadata1.height, metadata2.height)

  const resizedImg1 = await sharp(image1)
    .resize(width, height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toBuffer()

  const resizedImg2 = await sharp(image2)
    .resize(width, height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toBuffer()

  return { img1: resizedImg1, img2: resizedImg2, width, height }
}

/**
 * 원본 문제지와 제출된 이미지를 비교하여 풀이 부분(차이)만 추출
 * @param originalImage 원본 문제지 이미지 버퍼
 * @param submittedImage 제출된 이미지 버퍼 (풀이가 포함된)
 * @returns 차이 부분만 추출된 이미지 버퍼
 */
export async function extractSolutionFromImages(
  originalImage: Buffer,
  submittedImage: Buffer
): Promise<Buffer> {
  try {
    // 1. 두 이미지 크기 정규화
    const { img1: original, img2: submitted, width, height } = await normalizeImageSizes(
      originalImage,
      submittedImage
    )

    // 2. 전처리 (그레이스케일 + 노이즈 제거)
    const processedOriginal = await preprocessImage(original)
    const processedSubmitted = await preprocessImage(submitted)

    // 3. raw 픽셀 데이터 추출
    const originalRaw = await sharp(processedOriginal)
      .raw()
      .toBuffer({ resolveWithObject: true })

    const submittedRaw = await sharp(processedSubmitted)
      .raw()
      .toBuffer({ resolveWithObject: true })

    // 4. 픽셀 단위로 차이 계산
    const diffBuffer = Buffer.alloc(originalRaw.data.length)
    let diffPixelCount = 0
    const totalPixels = width * height

    for (let i = 0; i < originalRaw.data.length; i++) {
      const diff = Math.abs(originalRaw.data[i] - submittedRaw.data[i])

      // threshold 이상의 차이가 있는 픽셀만 추출
      // (풀이 부분은 보통 검정색 또는 파란색 펜으로 작성됨)
      if (diff > 30) {
        // 차이 부분은 검정색으로 표시 (제출된 이미지의 값 사용)
        diffBuffer[i] = submittedRaw.data[i]
        diffPixelCount++
      } else {
        // 차이 없는 부분은 흰색으로
        diffBuffer[i] = 255
      }
    }

    // 5. 차이 이미지 생성
    const diffImage = await sharp(diffBuffer, {
      raw: {
        width: originalRaw.info.width,
        height: originalRaw.info.height,
        channels: originalRaw.info.channels as 1 | 2 | 3 | 4,
      },
    })
      .png()
      .toBuffer()

    const diffPercentage = (diffPixelCount / totalPixels) * 100
    console.log(`이미지 diff 완료: ${diffPercentage.toFixed(2)}% 차이 감지`)

    return diffImage
  } catch (error) {
    console.error('이미지 diff 실패:', error)
    throw new Error(`이미지 diff 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  }
}

/**
 * 이미지 diff 결과와 함께 상세 정보 반환
 * @param originalImage 원본 문제지 이미지 버퍼
 * @param submittedImage 제출된 이미지 버퍼
 * @returns diff 이미지와 메타데이터
 */
export async function getImageDiffWithMetadata(
  originalImage: Buffer,
  submittedImage: Buffer
): Promise<ImageDiffResult> {
  const { img1: original, img2: submitted, width, height } = await normalizeImageSizes(
    originalImage,
    submittedImage
  )

  const processedOriginal = await preprocessImage(original)
  const processedSubmitted = await preprocessImage(submitted)

  const originalRaw = await sharp(processedOriginal).raw().toBuffer()
  const submittedRaw = await sharp(processedSubmitted).raw().toBuffer()

  const diffBuffer = Buffer.alloc(originalRaw.length)
  let diffPixelCount = 0

  for (let i = 0; i < originalRaw.length; i++) {
    const diff = Math.abs(originalRaw[i] - submittedRaw[i])
    if (diff > 30) {
      diffBuffer[i] = submittedRaw[i]
      diffPixelCount++
    } else {
      diffBuffer[i] = 255
    }
  }

  const diffImage = await sharp(diffBuffer, {
    raw: { width, height, channels: 1 },
  })
    .png()
    .toBuffer()

  return {
    diffImage,
    diffPercentage: (diffPixelCount / (width * height)) * 100,
    width,
    height,
  }
}

/**
 * 풀이 영역만 크롭하여 반환 (빈 공간 제거)
 * @param diffImage diff 이미지 버퍼
 * @returns 크롭된 이미지 버퍼
 */
export async function cropToSolutionArea(diffImage: Buffer): Promise<Buffer> {
  try {
    // trim으로 빈 공간(흰색) 제거
    const cropped = await sharp(diffImage)
      .trim({
        background: { r: 255, g: 255, b: 255 },
        threshold: 10,
      })
      .toBuffer()

    return cropped
  } catch (error) {
    // trim 실패 시 원본 반환 (모든 픽셀이 같은 색인 경우 등)
    console.warn('크롭 실패, 원본 이미지 반환:', error)
    return diffImage
  }
}

/**
 * Base64 문자열을 Buffer로 변환
 * @param base64 Base64 인코딩된 이미지 문자열
 * @returns Buffer
 */
export function base64ToBuffer(base64: string): Buffer {
  // data:image/xxx;base64, 접두사 제거
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

/**
 * Buffer를 Base64 문자열로 변환
 * @param buffer 이미지 버퍼
 * @param mimeType MIME 타입 (기본: image/png)
 * @returns Base64 인코딩된 문자열
 */
export function bufferToBase64(buffer: Buffer, mimeType: string = 'image/png'): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}
