import React, { useState, useEffect, useMemo } from 'react'
import Glide from './pages/Glide'

// 應用程式配置上下文
export const AppContext = React.createContext(null)

// 主題提供者
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // 從 localStorage 讀取主題設定
    const saved = localStorage.getItem('glide-theme')
    if (saved) return saved
    
    // 檢查系統偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    
    return 'light'
  })

  useEffect(() => {
    // 儲存主題設定
    localStorage.setItem('glide-theme', theme)
    
    // 更新 HTML 類別
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <AppContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  )
}

// 錯誤提示組件
const ErrorToast = ({ error, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000) // 5秒後自動消失
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-medium">發生錯誤</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-4 text-red-500 hover:text-red-700"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// 載入指示器組件
const LoadingIndicator = ({ message = "載入中..." }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 flex items-center space-x-4 shadow-xl">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="text-gray-700 font-medium">{message}</span>
    </div>
  </div>
)

// 網路狀態指示器
const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-40">
      <div className="flex items-center justify-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
        </svg>
        網路連線中斷，部分功能可能無法使用
      </div>
    </div>
  )
}

// 主應用程式組件
function App({ config }) {
  const [globalError, setGlobalError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  // 應用程式配置
  const appConfig = useMemo(() => ({
    ...config,
    // 可以在這裡添加更多運行時配置
    features: {
      darkMode: true,
      notifications: true,
      analytics: config.environment === 'production',
    }
  }), [config])

  // 全域錯誤處理
  useEffect(() => {
    const handleError = (event) => {
      console.error('Global error:', event.error)
      setGlobalError(event.error?.message || '發生未知錯誤')
    }

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      setGlobalError('網路請求失敗，請檢查連線狀態')
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // 鍵盤快捷鍵
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Ctrl/Cmd + K 開啟搜尋 (未來功能)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        console.log('搜尋快捷鍵觸發 (未實現)')
      }
      
      // F5 重新整理 (除非在輸入框中)
      if (event.key === 'F5' && event.target.tagName !== 'INPUT') {
        event.preventDefault()
        window.location.reload()
      }
      
      // Escape 關閉錯誤提示
      if (event.key === 'Escape' && globalError) {
        setGlobalError(null)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [globalError])

  // 應用程式上下文值
  const contextValue = {
    config: appConfig,
    setLoading: (loading, message = '') => {
      setIsLoading(loading)
      setLoadingMessage(message)
    },
    setError: setGlobalError,
    clearError: () => setGlobalError(null)
  }

  return (
    <ThemeProvider>
      <AppContext.Provider value={contextValue}>
        <div className="App min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          
          {/* 網路狀態指示器 */}
          <NetworkStatus />
          
          {/* 主要內容 */}
          <main className="relative">
            <Glide />
          </main>
          
          {/* 全域錯誤提示 */}
          {globalError && (
            <ErrorToast
              error={globalError}
              onDismiss={() => setGlobalError(null)}
            />
          )}
          
          {/* 載入指示器 */}
          {isLoading && (
            <LoadingIndicator message={loadingMessage} />
          )}
          
          {/* 開發模式的調試資訊 */}
          {config.debug && (
            <div className="fixed bottom-4 left-4 bg-gray-800 text-white text-xs p-2 rounded opacity-75 z-30">
              <div>版本: {config.version}</div>
              <div>環境: {config.environment}</div>
              <div>API: {config.apiUrl}</div>
            </div>
          )}
          
          {/* 頁尾 */}
          <footer className="mt-auto py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <div className="container mx-auto px-4">
              GLIDE-Lite v{config.version} - 智慧交通信號控制系統
              {config.environment === 'development' && (
                <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">
                  開發模式
                </span>
              )}
            </div>
          </footer>
        </div>
      </AppContext.Provider>
    </ThemeProvider>
  )
}

// 自訂 Hook：使用應用程式上下文
export const useApp = () => {
  const context = React.useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppContext.Provider')
  }
  return context
}

export default App