import { useState, useEffect } from 'react'

interface LogEntry {
  timestamp: string
  action: string
}

interface GroupedLogs {
  [date: string]: LogEntry[]
}

function LogViewer(): React.JSX.Element {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
    
    // Listen for log updates
    const unsubscribe = window.api.onLogsUpdated(() => {
      loadLogs()
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const loadLogs = async (): Promise<void> => {
    setLoading(true)
    try {
      const loadedLogs = await window.api.getLogs()
      setLogs(loadedLogs)
    } catch (error) {
      console.error('加载日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const groupLogsByDate = (logs: LogEntry[]): GroupedLogs => {
    const grouped: GroupedLogs = {}
    logs.forEach(log => {
      const dateKey = formatDate(log.timestamp)
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(log)
    })
    return grouped
  }

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedLogs = groupLogsByDate(filteredLogs)
  const dateKeys = Object.keys(groupedLogs).sort((a, b) => {
    const dateA = new Date(groupedLogs[a][0].timestamp)
    const dateB = new Date(groupedLogs[b][0].timestamp)
    return dateB.getTime() - dateA.getTime()
  })

  const getActualTimeSpan = (): string => {
    if (logs.length === 0) return '0 分钟'
    if (logs.length === 1) return '刚开始记录'
    
    // Get the oldest and newest log
    const timestamps = logs.map(log => new Date(log.timestamp).getTime())
    const oldest = Math.min(...timestamps)
    const newest = Math.max(...timestamps)
    
    // Calculate the difference in minutes
    const diffMs = newest - oldest
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 60) {
      return `${diffMinutes} 分钟`
    } else if (diffMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffMinutes / 60)
      const mins = diffMinutes % 60
      return `${hours} 小时 ${mins} 分钟`
    } else { // More than a day
      const days = Math.floor(diffMinutes / 1440)
      const hours = Math.floor((diffMinutes % 1440) / 60)
      return `${days} 天 ${hours} 小时`
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="px-6 pt-12 pb-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-800">活动日志</h1>
            <p className="text-sm text-gray-500 mt-1">
              共 {logs.length} 条记录 · 时间跨度 {getActualTimeSpan()}
            </p>
          </div>
          
          {/* Search */}
          <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索日志内容..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="h-16 w-16 mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg">{searchQuery ? '没有找到匹配的日志' : '还没有任何记录'}</p>
            <p className="text-sm mt-2">开始记录你的活动吧！</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6 pb-6">
            {dateKeys.map(dateKey => (
              <div key={dateKey} className="space-y-3">
                {/* Date Header */}
                <div className="sticky top-0 bg-gradient-to-br from-slate-50 to-slate-100 py-2 z-10">
                  <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full"></span>
                    {dateKey}
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      {groupedLogs[dateKey].length} 条记录
                    </span>
                  </h2>
                </div>

                {/* Log Entries */}
                <div className="space-y-2">
                  {groupedLogs[dateKey].map((log, index) => (
                    <div
                      key={`${log.timestamp}-${index}`}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-12 text-center">
                          <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 break-words">{log.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default LogViewer

