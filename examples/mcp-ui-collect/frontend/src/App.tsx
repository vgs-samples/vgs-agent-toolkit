import React, { useState } from 'react'
import { UIResourceRenderer } from '@mcp-ui/client'
import './App.css'

// Mock MCP server responses for demonstration
const mockMCPResponses = {
  hello: {
    type: 'resource',
    resource: {
      uri: 'ui://hello-world/greeting',
      mimeType: 'text/html',
      text: `
        <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; text-align: center;">
          <h1>Hello World! 👋</h1>
          <p>Welcome to MCP UI!</p>
          <button onclick="window.parent.postMessage({type: 'ui-action', action: 'greeting-clicked'}, '*')" 
                  style="background: white; color: #667eea; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
            Click me!
          </button>
        </div>
      `
    }
  },
  form: {
    type: 'resource',
    resource: {
      uri: 'ui://hello-world/form',
      mimeType: 'text/html',
      text: `
        <div style="padding: 20px; background: #f8f9fa; border-radius: 10px; border: 1px solid #dee2e6;">
          <h2>Contact Form</h2>
          <form onsubmit="event.preventDefault(); window.parent.postMessage({type: 'ui-action', action: 'form-submitted', data: {name: document.getElementById('name').value, email: document.getElementById('email').value}}, '*')">
            <div style="margin-bottom: 15px;">
              <label for="name" style="display: block; margin-bottom: 5px; font-weight: bold;">Name:</label>
              <input type="text" id="name" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
              <label for="email" style="display: block; margin-bottom: 5px; font-weight: bold;">Email:</label>
              <input type="email" id="email" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <button type="submit" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
              Submit
            </button>
          </form>
        </div>
      `
    }
  },
  chart: {
    type: 'resource',
    resource: {
      uri: 'ui://hello-world/chart',
      mimeType: 'text/html',
      text: `
        <div style="padding: 20px; background: white; border-radius: 10px; border: 1px solid #dee2e6;">
          <h2>Sample Chart</h2>
          <div style="display: flex; align-items: end; justify-content: center; height: 200px; gap: 10px; margin: 20px 0;">
            <div style="background: #ff6b6b; width: 40px; height: 60px; border-radius: 4px;"></div>
            <div style="background: #4ecdc4; width: 40px; height: 100px; border-radius: 4px;"></div>
            <div style="background: #45b7d1; width: 40px; height: 80px; border-radius: 4px;"></div>
            <div style="background: #96ceb4; width: 40px; height: 120px; border-radius: 4px;"></div>
            <div style="background: #feca57; width: 40px; height: 90px; border-radius: 4px;"></div>
          </div>
          <p style="text-align: center; color: #666;">Sample data visualization</p>
        </div>
      `
    }
  },
  collect: {
    type: 'resource',
    resource: {
      uri: 'ui://hello-world/collect',
      mimeType: 'text/html',
      text: `
        <div style="padding: 20px; background: #fff3cd; border-radius: 10px; border: 1px solid #ffeaa7;">
          <h2>📝 Data Collection Form</h2>
          <p style="color: #856404; margin-bottom: 20px;">
            <strong>PLACEHOLDER:</strong> This is where you can add your custom data collection form.
          </p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px dashed #dee2e6;">
            <h3 style="margin-top: 0; color: #6c757d;">Custom Form Area</h3>
            <p style="color: #6c757d; font-style: italic;">
              Replace this placeholder with your custom data collection form.
              You can add input fields, checkboxes, file uploads, or any other form elements.
            </p>
            <button onclick="window.parent.postMessage({type: 'ui-action', action: 'collect-submitted', data: {message: 'Placeholder form submitted'}}, '*')" 
                    style="background: #ffc107; color: #212529; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">
              Submit Placeholder
            </button>
          </div>
        </div>
      `
    }
  }
}

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
      content: 'Hello! I\'m your MCP UI assistant. Try typing "hello", "form", "chart", or "collect" to see different UI components! You can also toggle between mock mode and server mode.'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [useServer, setUseServer] = useState(false)
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
      if (useServer) {
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
      } else {
        // Use mock responses
        setTimeout(() => {
          const response = inputValue.toLowerCase()
          let uiResource = null

          if (response.includes('hello')) {
            uiResource = mockMCPResponses.hello
          } else if (response.includes('form')) {
            uiResource = mockMCPResponses.form
          } else if (response.includes('chart')) {
            uiResource = mockMCPResponses.chart
          } else if (response.includes('collect')) {
            uiResource = mockMCPResponses.collect
          }

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: uiResource ? 'Here\'s a UI component for you:' : `I received your message: "${inputValue}". Try typing "hello", "form", "chart", or "collect" to see UI components!`,
            uiResource
          }

          setMessages(prev => [...prev, assistantMessage])
        }, 1000)
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
    if (result.action === 'greeting-clicked') {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Thanks for clicking the greeting button! 🎉'
      }])
    } else if (result.action === 'form-submitted') {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Form submitted! Name: ${result.data.name}, Email: ${result.data.email}`
      }])
    } else if (result.action === 'card-created') {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Card ${result.card.data.id} created in VGS!`
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
                  alert('Server connection successful!')
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
        alert('Server connection failed!')
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
          <label>
            <input
              type="checkbox"
              checked={useServer}
              onChange={(e) => setUseServer(e.target.checked)}
            />
            Use Real Server
          </label>
        </div>
        
        {useServer && (
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
        )}
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