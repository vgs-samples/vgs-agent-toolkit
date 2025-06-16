
# Vault MCP

This project uses `fastmcp` and `uv` to initialize and run a MCP server for configuring the VGS Secure Data Platform (Vault + Proxy).

## Prerequisites

- Python 3.x
- `fastmcp` and `uv` libraries installed

## Installation

To install the required libraries, run:

```bash
pip install uv
uv venv
source .venv/bin/activate
```

## Running the Application

To run the application, navigate to the `mcp` directory and execute the following command:

```bash
uv --directory $(pwd) run main.py
```

This will start the FastMCP server and print a confirmation message. 

To see an example configuration look at `mcp.json` which shows a sample configuration file. Note the environment variables which are configured using instructions from SETUP.md

Make sure you ask your model to read SETUP.md to configure environment variables and ROUTES.md to learn how to manage routes. 