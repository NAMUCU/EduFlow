'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

interface GeoGebraEmbedProps {
  commands: string[]
  materialId?: string // 기존 GeoGebra 자료 ID
  width?: number | string
  height?: number
  className?: string
  appName?: 'graphing' | 'geometry' | 'classic' | '3d'
}

/**
 * GeoGebra 임베드 컴포넌트
 * GeoGebra API를 사용하여 도형/기하 시각화
 */
export default function GeoGebraEmbed({
  commands,
  materialId,
  width = '100%',
  height = 400,
  className = '',
  appName = 'geometry',
}: GeoGebraEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appletRef = useRef<any>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // useMemo로 containerId 생성 (컴포넌트 생명주기 동안 유지)
  const containerId = useMemo(
    () => `geogebra-${Math.random().toString(36).substring(7)}`,
    []
  )

  // 명령어 실행 콜백을 useCallback으로 메모이제이션
  const executeCommands = useCallback((api: any, cmds: string[], hasMaterialId: boolean) => {
    if (cmds.length > 0 && !hasMaterialId) {
      cmds.forEach((cmd) => {
        try {
          api.evalCommand(cmd)
        } catch (e) {
          console.error('GeoGebra 명령어 오류:', cmd, e)
        }
      })
    }
  }, [])

  useEffect(() => {
    // GeoGebra API 스크립트 로드
    if (typeof window !== 'undefined' && !window.GGBApplet) {
      const script = document.createElement('script')
      script.src = 'https://www.geogebra.org/apps/deployggb.js'
      script.async = true
      script.onload = () => setIsLoaded(true)
      script.onerror = () => setError('GeoGebra API 로드 실패')
      document.head.appendChild(script)
      scriptRef.current = script
    } else if (window.GGBApplet) {
      setIsLoaded(true)
    }

    // Cleanup: 스크립트 이벤트 핸들러 정리
    return () => {
      if (scriptRef.current) {
        scriptRef.current.onload = null
        scriptRef.current.onerror = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.GGBApplet) return

    // 이전 applet 정리
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
    }
    appletRef.current = null

    try {
      const parameters: Record<string, unknown> = {
        appName,
        width: typeof width === 'number' ? width : 700,
        height,
        showToolBar: false,
        showAlgebraInput: false,
        showMenuBar: false,
        enableRightClick: false,
        enableShiftDragZoom: true,
        showResetIcon: true,
        language: 'ko',
        country: 'KR',
        id: containerId,
        appletOnLoad: (api: any) => {
          appletRef.current = api
          executeCommands(api, commands, !!materialId)
        },
      }

      // 기존 자료 ID가 있으면 사용
      if (materialId) {
        parameters.material_id = materialId
      }

      const applet = new window.GGBApplet(parameters, true)
      applet.inject(containerId)
    } catch (err) {
      setError('GeoGebra 렌더링 오류')
      console.error(err)
    }

    return () => {
      // 정리: DOM과 ref 모두 클리어
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      appletRef.current = null
    }
  }, [isLoaded, commands, materialId, width, height, appName, containerId, executeCommands])

  // 에러 상태 렌더링
  const renderError = () => (
    <div className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}>
      <p className="text-red-600 text-sm">{error}</p>
      <div className="mt-2">
        <p className="text-xs text-gray-500 mb-1">GeoGebra 명령어:</p>
        <pre className="text-sm bg-red-100 p-2 rounded overflow-x-auto">
          {commands.join('\n')}
        </pre>
      </div>
    </div>
  )

  // 로딩 상태 렌더링
  const renderLoading = () => (
    <div
      className={`bg-gray-100 rounded-xl flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <div className="text-gray-500">GeoGebra 로딩 중...</div>
    </div>
  )

  // GeoGebra 렌더링
  const renderGeoGebra = () => (
    <div className={`rounded-xl overflow-hidden border ${className}`}>
      <div
        id={containerId}
        ref={containerRef}
        style={{ width, height }}
      />
    </div>
  )

  // 조건부 렌더링 - ternary 사용
  return error ? renderError() : !isLoaded ? renderLoading() : renderGeoGebra()
}

// GeoGebra 타입 선언
declare global {
  interface Window {
    GGBApplet?: new (
      parameters: Record<string, unknown>,
      html5?: boolean
    ) => {
      inject: (containerId: string) => void
    }
  }
}
