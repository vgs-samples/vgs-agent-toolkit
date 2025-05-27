import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { StripeTester } from './stripeTester.js';

console.log("Starting MCP server...");

const server = new McpServer({
  name: "Echo",
  version: "1.0.0"
});

server.tool(
  "hello-world",
  "Returns a simple hello world message",
  {},
  async () => ({
    content: [{ type: "text", text: "hello world" }]
  })
);

server.tool(
  "submit-stripe-payment",
  "Submits card data to Stripe using the StripeTester automation.",
  {
    pan: z.string().min(12).max(19),
    expiration: z.string().regex(/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/, "Expiration must be MM/YY or MM/YYYY"),
    name: z.string().min(1),
    postalCode: z.string().min(3),
    cvc: z.string().min(3)
  },
  async ({ pan, expiration, name, postalCode, cvc }) => {
    try {
      const tester = new StripeTester();
      await tester.initialize({ pan, expiration, name, postalCode, cvc });
      await tester.navigateToPaymentPage();
      await tester.fillPaymentDetails();
      const result = await tester.handleSubmission();
      await tester.cleanup();
      return {
        content: [{
          type: "text",
          text: result.success ? result.message : "Payment failed"
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Payment submission failed: ${error.message}`
        }]
      };
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
console.log("Creating transport...");
const transport = new StdioServerTransport();
console.log("Connecting server...");
await server.connect(transport);
console.log("Server connected and ready!");

console.log("started with hw5");
// Keep the process alive
process.stdin.resume();
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down...');
  process.exit(0);
});
