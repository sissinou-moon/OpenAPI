
export function generateCurl(url: string, method: string, headers: Record<string, string>, body: any): string {
    let cmd = `curl -X ${method.toUpperCase()} "${url}"`;

    Object.entries(headers).forEach(([key, value]) => {
        cmd += ` \\\n  -H "${key}: ${value}"`;
    });

    if (body && Object.keys(body).length > 0) {
        // Escape single quotes for shell safety if needed, basic implementation here
        const jsonBody = JSON.stringify(body, null, 2);
        cmd += ` \\\n  -d '${jsonBody}'`;
    }

    return cmd;
}

export function generateNode(url: string, method: string, headers: Record<string, string>, body: any): string {
    const hasBody = body && Object.keys(body).length > 0;

    let code = `const response = await fetch("${url}", {\n`;
    code += `  method: "${method.toUpperCase()}",\n`;
    code += `  headers: {\n`;
    Object.entries(headers).forEach(([key, value]) => {
        code += `    "${key}": "${value}",\n`;
    });
    code += `  },\n`;

    if (hasBody) {
        code += `  body: JSON.stringify(${JSON.stringify(body, null, 2).replace(/\n/g, '\n    ')})\n`;
    }

    code += `});\n\nconst data = await response.json();\nconsole.log(data);`;

    return code;
}
