'use client'

/**
 * RAG 문서 업로드 페이지
 * - PDF/마크다운 문서 업로드
 * - 기출문제, 교과서 등 업로드
 * - Gemini File Search API 연동
 */

import { useState, useCallback } from 'react'
import Link from 'next/link'

interface UploadedDocument {
  id: string
  name: string
  type: string
  size: string
  status: 'uploading' | 'processing' | 'indexed' | 'error'
  uploadedAt: string
  errorMessage?: string
}

// Mock 데이터
const mockDocuments: UploadedDocument[] = [
  { id: 'd1', name: '2025_수능_수학가형.pdf', type: 'pdf', size: '2.3 MB', status: 'indexed', uploadedAt: '2026-01-20' },
  { id: 'd2', name: '중2_수학_교과서_1학기.pdf', type: 'pdf', size: '15.8 MB', status: 'indexed', uploadedAt: '2026-01-19' },
  { id: 'd3', name: '고1_3월_모의고사_수학.pdf', type: 'pdf', size: '1.2 MB', status: 'indexed', uploadedAt: '2026-01-18' },
]

const statusLabels: Record<string, string> = {
  uploading: '업로드 중',
  processing: '처리 중',
  indexed: '완료',
  error: '오류'
}

const statusColors: Record<string, string> = {
  uploading: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  indexed: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800'
}

export default function RAGUploadPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>(mockDocuments)
  const [isDragging, setIsDragging] = useState(false)
  const [_uploading, setUploading] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    handleFiles(files)
  }

  const handleFiles = async (files: File[]) => {
    setUploading(true)

    for (const file of files) {
      // 새 문서 추가 (업로드 중 상태)
      const newDoc: UploadedDocument = {
        id: `d_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        name: file.name,
        type: file.name.split('.').pop() || 'unknown',
        size: formatFileSize(file.size),
        status: 'uploading',
        uploadedAt: new Date().toISOString().split('T')[0]
      }

      setDocuments(prev => [newDoc, ...prev])

      // Mock 업로드 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 처리 중으로 변경
      setDocuments(prev => prev.map(d =>
        d.id === newDoc.id ? { ...d, status: 'processing' as const } : d
      ))

      await new Promise(resolve => setTimeout(resolve, 1500))

      // 완료로 변경
      setDocuments(prev => prev.map(d =>
        d.id === newDoc.id ? { ...d, status: 'indexed' as const } : d
      ))
    }

    setUploading(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const deleteDocument = (id: string) => {
    if (confirm('정말 삭제하시겠습니까? 검색 인덱스에서도 제거됩니다.')) {
      setDocuments(prev => prev.filter(d => d.id !== id))
    }
  }

  const reprocessDocument = (id: string) => {
    setDocuments(prev => prev.map(d =>
      d.id === id ? { ...d, status: 'processing' as const, errorMessage: undefined } : d
    ))

    // Mock 재처리
    setTimeout(() => {
      setDocuments(prev => prev.map(d =>
        d.id === id ? { ...d, status: 'indexed' as const } : d
      ))
    }, 2000)
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/search" className="hover:text-blue-600">RAG 검색</Link>
          <span>/</span>
          <span>문서 업로드</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">RAG 문서 관리</h1>
        <p className="text-gray-600 mt-1">기출문제, 교과서, 모의고사 등을 업로드하여 AI 검색에 활용합니다</p>
      </div>

      {/* 업로드 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="mt-4 text-lg text-gray-600">
          파일을 드래그하여 놓거나
        </p>
        <label className="mt-2 inline-block">
          <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            파일 선택
          </span>
          <input
            type="file"
            multiple
            accept=".pdf,.md,.txt"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
        <p className="mt-2 text-sm text-gray-500">
          PDF, 마크다운, 텍스트 파일 지원 (최대 50MB)
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">전체 문서</div>
          <div className="text-2xl font-bold text-gray-900">{documents.length}개</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">인덱싱 완료</div>
          <div className="text-2xl font-bold text-green-600">
            {documents.filter(d => d.status === 'indexed').length}개
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">처리 중</div>
          <div className="text-2xl font-bold text-yellow-600">
            {documents.filter(d => d.status === 'processing' || d.status === 'uploading').length}개
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">오류</div>
          <div className="text-2xl font-bold text-red-600">
            {documents.filter(d => d.status === 'error').length}개
          </div>
        </div>
      </div>

      {/* 문서 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-medium text-gray-900">업로드된 문서</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">파일명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">크기</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">업로드일</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-gray-900">{doc.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">
                  {doc.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {doc.size}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[doc.status]}`}>
                    {statusLabels[doc.status]}
                  </span>
                  {doc.errorMessage && (
                    <p className="text-xs text-red-500 mt-1">{doc.errorMessage}</p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {doc.uploadedAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {doc.status === 'error' && (
                      <button
                        onClick={() => reprocessDocument(doc.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        재처리
                      </button>
                    )}
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {documents.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">문서가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">위 영역에 파일을 드래그하여 업로드하세요.</p>
          </div>
        )}
      </div>

      {/* 도움말 */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">RAG (Retrieval-Augmented Generation) 안내</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 업로드된 문서는 AI가 문제 생성 및 검색 시 참고 자료로 활용합니다.</li>
          <li>• PDF 파일은 자동으로 텍스트 추출 및 수식 인식이 진행됩니다.</li>
          <li>• 인덱싱이 완료된 문서는 <Link href="/dashboard/search" className="underline">RAG 검색</Link>에서 검색할 수 있습니다.</li>
          <li>• 저작권에 유의하여 업로드해 주세요.</li>
        </ul>
      </div>
    </div>
  )
}
