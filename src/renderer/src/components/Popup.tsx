import { useState, useEffect, FormEvent } from 'react'

function Popup(): React.JSX.Element {
  const [action, setAction] = useState('')

  useEffect(() => {
    // Auto-focus the input when the window opens
    const input = document.getElementById('action-input') as HTMLInputElement
    if (input) {
      input.focus()
    }
  }, [])

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault()
    if (action.trim()) {
      if (window.api && window.api.submitLog) {
        window.api.submitLog(action.trim())
      }
      setAction('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      if (window.api && window.api.closePopup) {
        window.api.closePopup()
      }
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'transparent' }}>
      <div className="w-full h-full bg-white rounded-2xl shadow-2xl p-6 flex flex-col justify-center">
        {/* Prompt */}
        <h1 className="text-xl font-bold text-gray-800 mb-2 text-center">
          在过去的25分钟里，你做了什么？
        </h1>
        <p className="text-xs text-gray-500 mb-4 text-center">
          What did you accomplish in the last 25 minutes?
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            id="action-input"
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的活动记录..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400 text-sm"
            autoComplete="off"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!action.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg text-sm"
            >
              记录 (Log It)
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.api && window.api.closePopup) {
                  window.api.closePopup()
                }
              }}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors duration-200 text-sm"
            >
              取消
            </button>
          </div>
        </form>

        {/* Hint */}
        <p className="text-xs text-gray-400 mt-3 text-center">
          按 Enter 提交 · 按 Esc 关闭
        </p>
      </div>
    </div>
  )
}

export default Popup

