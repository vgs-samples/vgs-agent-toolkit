import React, { useState } from 'react'
import { UIResourceRenderer } from '@mcp-ui/client'
import './App.css'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  uiResource?: any
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your MCP UI assistant. Try typing "collect" to render a VGS Collect UI component!'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [serverUrl, setServerUrl] = useState('http://localhost:8080')

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
        // Connect to real MCP server
        const response = await fetch(`${serverUrl}/mcp/`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
          },
          body: JSON.stringify({"jsonrpc": "2.0", "method": "tools/call", "id": 2, "params": {"name": inputValue, "arguments": {}}})
        })

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`)
        }

        // Handle Server-Sent Events stream
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body reader available')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) // Remove 'data: ' prefix
                console.log('Received SSE data:', data)
                
                if (data.result?.content) {
                  const content = data.result.content
                  let messageContent = ''
                  let uiResource = null

                  // Parse the content array
                  for (const item of content) {
                    if (item.type === 'text') {
                      messageContent += item.text.replace(/^\[|\]$/g, '').replace(/^"|"$/g, '')
                      console.log('Found text:', item)
                    } else if (item.type === 'resource') {
                      uiResource = item
                      console.log('Found UI resource:', item)
                    }
                  }

                  const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'assistant',
                    content: messageContent || 'Received response from server',
                    uiResource: uiResource || null
                  }

                  console.log('Created assistant message with UI resource:', assistantMessage)
                  setMessages(prev => [...prev, assistantMessage])
                }
              } catch (error) {
                console.error('Error parsing SSE data:', error)
              }
            }
          }
        }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUIAction = async (result: any) => {
    console.log('UI Action:', result)
    
    // Handle different UI actions
    if (result.action === 'card-created') {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Card ${result.card.data.id} created in VGS!`
      }])
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: `${result.message}!`
      }])
    }
  }

  const testServerConnection = async () => {
    try {
      const response = await fetch(`${serverUrl}/mcp/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({"jsonrpc": "2.0", "method": "tools/list", "id": 1})
      })
      
      if (response.ok) {
        // Handle SSE response for test connection
        const reader = response.body?.getReader()
        if (reader) {
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  console.log('Test connection SSE data:', data)
                  handleUIAction({action: 'connection-successful', message: 'Server connection successful, type "collect" to see a VGS Collect UI component!'})
                  return
                } catch (error) {
                  console.error('Error parsing test SSE data:', error)
                }
              }
            }
          }
        }
        alert('Server connection successful!')
      } else {
        handleUIAction({action: 'connection-failed', message: 'Server connection failed! Please check the backend server is running'})
      }
    } catch (error) {
      alert(`Server connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>MCP UI Hello World</h1>
        <p>Chat with UI components powered by MCP UI</p>
      </header>

      <div className="server-controls">
          <div className="control-group">
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="Server URL"
              style={{ width: '200px', marginRight: '10px' }}
            />
            <button onClick={testServerConnection} style={{ padding: '5px 10px' }}>
              Test Connection
            </button>
          </div>
      </div>

      <div className="chat-container">
        <div className="messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                {message.content}
              </div>
              {message.uiResource && (
                <div className="ui-resource">
                  <UIResourceRenderer
                    resource={message.uiResource.resource}
                    onUIAction={handleUIAction}
                  />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="loading">Thinking...</div>
              </div>
            </div>
          )}
        </div>

        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default App 