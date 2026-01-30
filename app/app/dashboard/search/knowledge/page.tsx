'use client';

/**
 * 지식 관리 페이지
 * - 저장된 문서/청크 목록 조회
 * - 과목/학년/타입별 필터링
 * - 중복 확인
 * - 공용 자료 관리 (Super Admin)
 */

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

interface KnowledgeDocument {
  id: string;
  filename: string;
  type: string;
  subject: string | null;
  grade: string | null;
  unit: string | null;
  year: number | null;
  academy_id: string | null;
  status: string;
  file_size: number;
  pgvector_indexed: boolean;
  chunk_count: number;
  created_at: string;
  pgvector_indexed_at: string | null;
}

interface KnowledgeStats {
  totalDocuments: number;
  indexedDocuments: number;
  totalChunks: number;
  bySubject: Record<string, number>;
  byGrade: Record<string, number>;
  byType: Record<string, number>;
  publicCount: number;
}

export default function KnowledgeManagementPage() {
  const { user } = useContext(AuthContext);
  const academyId = user?.academyId || null;
  const isSuperAdmin = user?.role === 'super_admin';

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [includePublic, setIncludePublic] = useState(true);
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  // 선택된 문서
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const fetchKnowledge = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (academyId && !showPublicOnly) params.append('academyId', academyId);
      if (includePublic || showPublicOnly) params.append('includePublic', 'true');
      if (filterSubject) params.append('subject', filterSubject);
      if (filterGrade) params.append('grade', filterGrade);
      if (filterType) params.append('type', filterType);

      const response = await fetch(`/api/rag/knowledge?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '지식 목록 조회 실패');
      }

      let docs = result.data.documents || [];

      // 공용 자료만 보기
      if (showPublicOnly) {
        docs = docs.filter((d: KnowledgeDocument) => !d.academy_id);
      }

      setDocuments(docs);
      setStats(result.data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, [academyId, filterSubject, filterGrade, filterType, includePublic, showPublicOnly]);

  useEffect(() => {
    fetchKnowledge();
  }, [fetchKnowledge]);

  const handleDelete = async (docId: string) => {
    if (!confirm('이 문서를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/rag/delete?documentId=${docId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '삭제 실패');
      }

      setDocuments(docs => docs.filter(d => d.id !== docId));
      setSelectedDocs(selected => {
        const newSet = new Set(selected);
        newSet.delete(docId);
        return newSet;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류 발생');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.size === 0) return;
    if (!confirm(`${selectedDocs.size}개 문서를 삭제하시겠습니까?`)) return;

    const deletePromises = Array.from(selectedDocs).map(docId =>
      fetch(`/api/rag/delete?documentId=${docId}`, { method: 'DELETE' })
    );

    await Promise.all(deletePromises);
    fetchKnowledge();
    setSelectedDocs(new Set());
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      exam: '기출문제',
      textbook: '교과서',
      mockexam: '모의고사',
      workbook: '문제집',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (doc: KnowledgeDocument) => {
    if (doc.pgvector_indexed) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          인덱싱 완료 ({doc.chunk_count} 청크)
        </span>
      );
    }
    if (doc.status === 'processing') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          처리 중
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
        대기 중
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">지식 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          업로드된 문서와 인덱싱 상태를 관리합니다.
        </p>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">전체 문서</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">인덱싱 완료</p>
            <p className="text-2xl font-bold text-green-600">{stats.indexedDocuments}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">총 청크</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalChunks}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">공용 자료</p>
            <p className="text-2xl font-bold text-purple-600">{stats.publicCount}</p>
          </div>
        </div>
      )}

      {/* 필터 및 통계 상세 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">필터</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* 과목 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">과목</label>
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="">전체</option>
                {stats && Object.keys(stats.bySubject).map(subject => (
                  <option key={subject} value={subject}>
                    {subject} ({stats.bySubject[subject]})
                  </option>
                ))}
              </select>
            </div>

            {/* 학년 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학년</label>
              <select
                value={filterGrade}
                onChange={e => setFilterGrade(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="">전체</option>
                {stats && Object.keys(stats.byGrade).map(grade => (
                  <option key={grade} value={grade}>
                    {grade} ({stats.byGrade[grade]})
                  </option>
                ))}
              </select>
            </div>

            {/* 타입 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="">전체</option>
                {stats && Object.keys(stats.byType).map(type => (
                  <option key={type} value={type}>
                    {getTypeLabel(type)} ({stats.byType[type]})
                  </option>
                ))}
              </select>
            </div>

            {/* 공용 자료 포함 */}
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includePublic}
                  onChange={e => setIncludePublic(e.target.checked)}
                  className="rounded border-gray-300"
                  disabled={showPublicOnly}
                />
                <span className="text-sm text-gray-700">공용 자료 포함</span>
              </label>
            </div>

            {/* 공용 자료만 보기 (Super Admin) */}
            {isSuperAdmin && (
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showPublicOnly}
                    onChange={e => setShowPublicOnly(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">공용만 보기</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 일괄 작업 버튼 */}
      {selectedDocs.size > 0 && (
        <div className="mb-4 flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedDocs.size}개 선택됨
          </span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            선택 삭제
          </button>
          <button
            onClick={() => setSelectedDocs(new Set())}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            선택 해제
          </button>
        </div>
      )}

      {/* 문서 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            불러오는 중...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            저장된 문서가 없습니다.
            <br />
            <a href="/dashboard/search/upload" className="text-blue-600 hover:underline mt-2 inline-block">
              자료 업로드하기
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedDocs.size === documents.length && documents.length > 0}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedDocs(new Set(documents.map(d => d.id)));
                        } else {
                          setSelectedDocs(new Set());
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">파일명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">과목/학년</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">크기</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">업로드</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">구분</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedDocs.has(doc.id)}
                        onChange={e => {
                          const newSet = new Set(selectedDocs);
                          if (e.target.checked) {
                            newSet.add(doc.id);
                          } else {
                            newSet.delete(doc.id);
                          }
                          setSelectedDocs(newSet);
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={doc.filename}>
                        {doc.filename}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{getTypeLabel(doc.type)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        {doc.subject || '-'} / {doc.grade || '-'}
                        {doc.unit && <span className="block text-xs text-gray-400">{doc.unit}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(doc)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatFileSize(doc.file_size)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(doc.created_at)}</td>
                    <td className="px-4 py-3">
                      {doc.academy_id ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          학원
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          공용
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 업로드 링크 */}
      <div className="mt-6 flex justify-end gap-4">
        <a
          href="/dashboard/search/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          자료 업로드
        </a>
        {isSuperAdmin && (
          <a
            href="/dashboard/search/upload?public=true"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            공용 자료 업로드
          </a>
        )}
      </div>
    </div>
  );
}
