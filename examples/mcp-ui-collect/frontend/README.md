# MCP UI Hello World

A simple hello world application demonstrating MCP UI integration with a chat interface. This app shows how to render interactive UI components returned from an MCP server.

## Features

- **Chat Interface**: A modern chat UI with message history
- **UI Component Rendering**: Renders HTML components returned from MCP server responses
- **Interactive Components**: Supports interactive forms, buttons, and charts
- **Server Integration**: Can connect to a real MCP server or use mock responses
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### Option 1: Automated Setup (Recommended)

1. Clone or download this project
2. Navigate to the project directory:
   ```bash
   cd mcp-ui-hello-world
   ```

3. Run the setup script:
   ```bash
   ./setup.sh
   ```

4. Start the frontend:
   ```bash
   npm run dev
   ```

5. In another terminal, start the server:
   ```bash
   cd server && npm start
   ```

6. Open your browser and navigate to `http://localhost:3008`

### Option 2: Manual Setup

1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3008`

## How to Use

1. **Start a conversation**: Type any message in the chat input
2. **Toggle server mode**: Use the checkbox to switch between mock mode and real server mode
3. **Configure server**: When using server mode, set your server URL (default: http://localhost:8080/mcp)
4. **Trigger UI components**: Try typing these keywords to see different UI components:
   - `hello` - Shows a greeting card with an interactive button
   - `form` - Displays a contact form
   - `chart` - Shows a sample data visualization
   - `collect` - Shows a data collection form (placeholder for customization)

5. **Interact with components**: Click buttons, fill out forms, and see the responses in the chat

## Demo UI Components

### Hello World Card
- Gradient background with greeting message
- Interactive button that responds to clicks
- Demonstrates basic UI interaction

### Contact Form
- Input fields for name and email
- Form validation
- Submit functionality that captures form data

### Sample Chart
- CSS-based bar chart visualization
- Demonstrates data presentation capabilities

### Data Collection Form
- Placeholder form for custom data collection
- Yellow warning styling to indicate it's a placeholder
- Ready for you to customize with your own form elements

## Project Structure

```
mcp-ui-hello-world/
├── src/
│   ├── App.tsx          # Main application component
│   ├── App.css          # Application styles
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── server/
│   ├── server-example.js # Example MCP server
│   └── package.json     # Server dependencies
├── public/              # Static assets
├── package.json         # Frontend dependencies and scripts
├── vite.config.ts       # Vite configuration
├── setup.sh            # Automated setup script
└── README.md           # This file
```

## MCP UI Integration

This application demonstrates how to integrate MCP UI components:

1. **UIResourceRenderer**: The main component that renders MCP UI resources
2. **Mock Responses**: Simulated MCP server responses with UI components
3. **Server Integration**: Real MCP server example with Express.js
4. **Event Handling**: Handles UI component interactions and form submissions

## Server Example

The included server example (`server-example.js`) demonstrates how to create a real MCP server that returns UI resources:

### Features
- Express.js server with CORS support
- MCP UI resource creation using `@mcp-ui/server`
- RESTful API endpoint for handling chat messages
- Health check endpoint

### Running the Server

```bash
cd server
npm install
npm start
```

The server will be available at `http://localhost:3009`

### API Endpoints

- `POST /api/mcp` - Handle chat messages and return UI resources
- `GET /health` - Health check endpoint

## Customization

### Adding New UI Components

To add new UI components, modify the `mockMCPResponses` object in `App.tsx`:

```typescript
const mockMCPResponses = {
  // ... existing components
  newComponent: {
    type: 'resource',
    resource: {
      uri: 'ui://hello-world/new-component',
      mimeType: 'text/html',
      text: `
        <div style="padding: 20px; background: #f0f0f0;">
          <h2>New Component</h2>
          <p>Your custom HTML here</p>
        </div>
      `
    }
  }
}
```

### Customizing the Collect Form

The "collect" keyword currently shows a placeholder form. To customize it:

1. **Frontend (Mock Mode)**: Edit the `collect` object in `src/App.tsx`
2. **Server Mode**: Edit the `createCollectResource()` function in `server-example.js`

Example customization:
```html
<div style="padding: 20px; background: #e3f2fd; border-radius: 10px;">
  <h2>📊 Survey Form</h2>
  <form onsubmit="event.preventDefault(); window.parent.postMessage({type: 'ui-action', action: 'collect-submitted', data: {age: document.getElementById('age').value, feedback: document.getElementById('feedback').value}}, '*')">
    <div style="margin-bottom: 15px;">
      <label for="age">Age:</label>
      <input type="number" id="age" required>
    </div>
    <div style="margin-bottom: 15px;">
      <label for="feedback">Feedback:</label>
      <textarea id="feedback" rows="4" required></textarea>
    </div>
    <button type="submit">Submit Survey</button>
  </form>
</div>
```

### Extending the Server

To add new server-side UI components, modify the server example:

```javascript
const createNewComponent = () => {
  return createUIResource({
    uri: 'ui://hello-world/new-component',
    content: { 
      type: 'rawHtml', 
      htmlString: `
        <div style="padding: 20px; background: #f0f0f0;">
          <h2>New Component</h2>
          <p>Your custom HTML here</p>
        </div>
      `
    },
    encoding: 'text'
  });
};
```

## Technologies Used

- **React**: Frontend framework
- **TypeScript**: Type safety
- **Vite**: Build tool and development server
- **Express.js**: Backend server framework
- **MCP UI**: UI component rendering library
- **CSS**: Styling and responsive design

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in `vite.config.ts` or server configuration
2. **CORS errors**: Ensure the server is running and the URL is correct
3. **Module not found**: Run `npm install` to install dependencies

### Development Tips

- Use the browser's developer tools to inspect UI components
- Check the console for error messages and UI action logs
- Test server connectivity using the "Test Connection" button

## License

MIT License - feel free to use this project as a starting point for your own MCP UI applications!

## Contributing

This is a demo project, but feel free to fork and modify it for your own needs. The MCP UI framework is actively developed and you can contribute to the main project at [MCP UI GitHub](https://github.com/idosal/mcp-ui). 