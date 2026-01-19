<template>
  <n-drawer
    v-model:show="drawerVisible"
    :width="600"
    placement="right"
    :trap-focus="false"
    :auto-focus="false"
  >
    <n-drawer-content title="Generate Code" closable>
      <div class="code-generator-drawer">
        <div class="language-selector">
          <n-text strong>Select Language</n-text>
          <n-select
            id="language"
            v-model:value="selectedLanguage"
            :options="languageOptions"
            placeholder="Choose a language"
            style="width: 100%"
          />
        </div>

        <div class="code-output">
          <n-text strong>Generated Code</n-text>
          <n-code :code="generatedCode" :language="codeLanguage" />
          <div class="code-actions">
            <n-button type="primary" @click="copyCode">
              <template #icon>
                <n-icon><CopyOutline /></n-icon>
              </template>
              Copy Code
            </n-button>
          </div>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { NDrawer, NDrawerContent, NButton, NSelect, NCode, NIcon, useMessage } from 'naive-ui';
import { CopyOutline } from '@vicons/ionicons5';
import type { RequestContext } from '@/types';
import * as Handlebars from 'handlebars';

interface Props {
  show?: boolean;
  context: RequestContext | null;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  show: false
});
const emit = defineEmits<Emits>();

const drawerVisible = computed({
  get: () => props.show || false,
  set: (value) => emit('update:show', value)
});

const message = useMessage();
const selectedLanguage = ref('javascript');
const codeLanguage = computed(() => {
  const languageMap: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python',
    curl: 'bash',
    go: 'go',
    java: 'java',
    csharp: 'csharp'
  };
  return languageMap[selectedLanguage.value] || 'javascript';
});

const languageOptions = [
  { label: 'JavaScript (Fetch)', value: 'javascript' },
  { label: 'TypeScript (Fetch)', value: 'typescript' },
  { label: 'Python (Requests)', value: 'python' },
  { label: 'cURL', value: 'curl' },
  { label: 'Go (net/http)', value: 'go' },
  { label: 'Java (HttpClient)', value: 'java' },
  { label: 'C# (HttpClient)', value: 'csharp' }
];

// Handlebars templates
const templates: Record<string, HandlebarsTemplateDelegate<any>> = {
  javascript: Handlebars.compile(`// JavaScript (Fetch) code for {{method}} {{url}}

{{#if params}}
const url = "{{fullUrl}}";
{{else}}
const url = "{{url}}";
{{/if}}

{{#if headers}}
const headers = {
{{#each headers}}
  "{{key}}": "{{value}}",
{{/each}}
};

{{/if}}
{{#if hasBody}}
{{#if isRaw}}
const body = \`{{{body.raw}}}\`;

{{/if}}
{{#if isJson}}
const body = {{body.raw}};

{{/if}}
{{#if isFormData}}
const formData = new FormData();
{{#each body.formData}}
formData.append("{{key}}", "{{value}}");
{{/each}}

const body = formData;

{{/if}}
{{#if isUrlEncoded}}
const body = "{{formData}}";

{{/if}}
{{/if}}
async function fetchData() {
  try {
    const response = await fetch(url, {
      method: "{{method}}",
{{#if headers}}
      headers,
{{/if}}
{{#if hasBody}}
      body,
{{/if}}
    });

    const data = await response.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

fetchData();`),
  typescript: Handlebars.compile(`// TypeScript (Fetch) code for {{method}} {{url}}

{{#if params}}
const url: string = "{{fullUrl}}";
{{else}}
const url: string = "{{url}}";
{{/if}}

{{#if headers}}
const headers: Record<string, string> = {
{{#each headers}}
  "{{key}}": "{{value}}",
{{/each}}
};

{{/if}}
{{#if hasBody}}
{{#if isRaw}}
const body: string = \`{{{body.raw}}}\`;

{{/if}}
{{#if isJson}}
const body: any = {{body.raw}};

{{/if}}
{{#if isFormData}}
const body: FormData = new FormData();
{{#each body.formData}}
body.append("{{key}}", "{{value}}");
{{/each}}

{{/if}}
{{#if isUrlEncoded}}
const body: string = "{{formData}}";

{{/if}}
{{/if}}
async function fetchData(): Promise<void> {
  try {
    const response: Response = await fetch(url, {
      method: "{{method}}",
{{#if headers}}
      headers,
{{/if}}
{{#if hasBody}}
      body,
{{/if}}
    });

    const data: any = await response.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

fetchData();`),
  python: Handlebars.compile(`# Python (Requests) code for {{method}} {{url}}

import requests

{{#if params}}
params = {
{{#each params}}
    "{{key}}": "{{value}}",
{{/each}}
}

{{/if}}
{{#if headers}}
headers = {
{{#each headers}}
    "{{key}}": "{{value}}",
{{/each}}
}

{{/if}}
{{#if hasBody}}
{{#if isRaw}}
data = """{{{body.raw}}}"""

{{/if}}
{{#if isJson}}
import json

data = {{body.raw}}

{{/if}}
{{#if isFormData}}
from requests_toolbelt.multipart.encoder import MultipartEncoder

data = MultipartEncoder(
    fields=[
{{#each body.formData}}
        ("{{key}}", "{{value}}"),
{{/each}}
    ]
)

headers["Content-Type"] = data.content_type

{{/if}}
{{#if isUrlEncoded}}
data = {
{{#each body.urlencoded}}
    "{{key}}": "{{value}}",
{{/each}}
}

{{/if}}
{{/if}}
try:
    response = requests.{{methodLowerCase}}(
        "{{url}}"
{{#if params}}
        , params=params
{{/if}}
{{#if headers}}
        , headers=headers
{{/if}}
{{#if hasBody}}
        , data=data
{{/if}}
{{#if isJson}}
        , json=data
{{/if}}
    )

    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print("Error:", e)`),
  curl: Handlebars.compile(`# cURL command for {{method}} {{url}}

curl -X {{method}} \\
{{#if headers}}
{{#each headers}}
  -H "{{key}}: {{value}}" \\
{{/each}}
{{/if}}
{{#if hasBody}}
{{#if isRaw}}
  -d '{{body.raw}}' \\
{{/if}}
{{#if isFormData}}
{{#each body.formData}}
  -F "{{key}}={{value}}" \\
{{/each}}
{{/if}}
{{#if isUrlEncoded}}
  -d '{{formData}}' \\
{{/if}}
{{/if}}
  "{{fullUrl}}"`),
  go: Handlebars.compile(`// Go (net/http) code for {{method}} {{url}}

package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "net/url"
    "strings"
)

func main() {
    baseURL := "{{url}}"

{{#if params}}
    params := url.Values{}
{{#each params}}
    params.Add("{{key}}", "{{value}}")
{{/each}}
    fullURL := baseURL + "?" + params.Encode()

{{else}}
    fullURL := baseURL

{{/if}}
{{#if hasBody}}
{{#if isRaw}}
    var requestBody []byte
    requestBody = []byte(\`{{{body.raw}}}\`)

{{/if}}
{{#if isFormData}}
    // For form-data, you would typically use mime/multipart
    // This is a simplified example
    var requestBody []byte
    formData := url.Values{}
{{#each body.formData}}
    formData.Add("{{key}}", "{{value}}")
{{/each}}
    requestBody = []byte(formData.Encode())

{{/if}}
{{#if isUrlEncoded}}
    var requestBody []byte
    formData := url.Values{}
{{#each body.urlencoded}}
    formData.Add("{{key}}", "{{value}}")
{{/each}}
    requestBody = []byte(formData.Encode())

{{/if}}
{{/if}}
    client := &http.Client{}
    var req *http.Request
    var err error

{{#if hasBody}}
    req, err = http.NewRequest("{{method}}", fullURL, bytes.NewBuffer(requestBody))
{{else}}
    req, err = http.NewRequest("{{method}}", fullURL, nil)
{{/if}}
    if err != nil {
        fmt.Println("Error creating request:", err)
        return
    }

{{#if headers}}
{{#each headers}}
    req.Header.Add("{{key}}", "{{value}}")
{{/each}}
{{/if}}
{{#if isUrlEncoded}}
    req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

{{/if}}
{{#if isJson}}
    req.Header.Add("Content-Type", "application/json")

{{/if}}
    resp, err := client.Do(req)
    if err != nil {
        fmt.Println("Error sending request:", err)
        return
    }
    defer resp.Body.Close();

    fmt.Println("Status Code:", resp.Status)
}`),
  java: Handlebars.compile(`// Java (HttpClient) code for {{method}} {{url}}

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

public class HttpRequestExample {
    public static void main(String[] args) {
        try {
{{#if params}}
            // Build URL with parameters
            Map<String, String> parameters = new HashMap<>();
{{#each params}}
            parameters.put("{{key}}", "{{value}}");
{{/each}}
            String query = parameters.entrySet().stream()
                .map(entry -> {
                    try {
                        return URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8.toString()) + "=" + 
                               URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8.toString());
                    } catch (Exception e) {
                        return "";
                    }
                })
                .collect(Collectors.joining("&"));
            String fullUrl = "{{url}}" + (query.isEmpty() ? "" ? "" : "?" + query);

{{else}}
            String fullUrl = "{{url}}";

{{/if}}
{{#if hasBody}}
{{#if isRaw}}
            // Build request body
            String requestBody = """{{{body.raw}}}""";

{{/if}}
{{#if isJson}}
            // Build request body
            String requestBody = """{{{body.raw}}}""";

{{/if}}
{{#if isFormData}}
            // For form-data, you would typically use multipart/form-data
            // This is a simplified example
            Map<String, String> formData = new HashMap<>();
{{#each body.formData}}
            formData.put("{{key}}", "{{value}}");
{{/each}}
            String requestBody = formData.entrySet().stream()
                .map(entry -> {
                    try {
                        return URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8.toString()) + "=" + 
                               URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8.toString());
                    } catch (Exception e) {
                        return "";
                    }
                })
                .collect(Collectors.joining("&"));

{{/if}}
{{#if isUrlEncoded}}
            // Build form-urlencoded body
            Map<String, String> formData = new HashMap<>();
{{#each body.urlencoded}}
            formData.put("{{key}}", "{{value}}");
{{/each}}
            String requestBody = formData.entrySet().stream()
                .map(entry -> {
                    try {
                        return URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8.toString()) + "=" + 
                               URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8.toString());
                    } catch (Exception e) {
                        return "";
                    }
                })
                .collect(Collectors.joining("&"));

{{/if}}
{{/if}}
            // Create HttpClient
            HttpClient client = HttpClient.newHttpClient();

            // Build request
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(fullUrl))
                .method("{{method}}", 
{{#if hasBody}}
HttpRequest.BodyPublishers.ofString(requestBody)
{{else}}
HttpRequest.BodyPublishers.noBody()
{{/if}}
);

{{#if headers}}
            // Add headers
{{#each headers}}
            requestBuilder.header("{{key}}", "{{value}}");
{{/each}}

{{/if}}
{{#if isUrlEncoded}}
            requestBuilder.header("Content-Type", "application/x-www-form-urlencoded");

{{/if}}
{{#if isJson}}
            requestBuilder.header("Content-Type", "application/json");

{{/if}}
            HttpRequest request = requestBuilder.build();

            // Send request and get response
            HttpResponse<String> response = client.send(
                request,
                HttpResponse.BodyHandlers.ofString()
            );

            // Print response
            System.out.println("Status Code: " + response.statusCode());
            System.out.println("Response Body: " + response.body());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`),
  csharp: Handlebars.compile(`// C# (HttpClient) code for {{method}} {{url}}

using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        await MakeRequest();
    }

    static async Task MakeRequest()
    {
        try {
{{#if params}}
            // Build URL with parameters
            var parameters = new Dictionary<string, string>();
{{#each params}}
            parameters.Add("{{key}}", "{{value}}");
{{/each}}
            var queryString = string.Join("&", parameters.Select(p => $"{UriEscapeDataString(p.Key)}={UriEscapeDataString(p.Value)}"));
            var fullUrl = "{{url}}" + (queryString.Length > 0 ? "?" + queryString : "");

{{else}}
            var fullUrl = "{{url}}";

{{/if}}
            // Create HttpClient
            using var client = new HttpClient();

{{#if headers}}
            // Add headers
{{#each headers}}
            client.DefaultRequestHeaders.Add("{{key}}", "{{value}}");
{{/each}}

{{/if}}
{{#if hasBody}}
{{#if isRaw}}
            // Build request body
            var requestBody = @"""{{{body.raw}}}\"";
            var content = new StringContent(requestBody, Encoding.UTF8
{{#if isJson}}
, "application/json"
{{/if}}
);

{{/if}}
{{#if isFormData}}
            // Build form-data content
            var content = new FormUrlEncodedContent(new[]
            {
{{#each body.formData}}
                new KeyValuePair<string, string>("{{key}}", "{{value}}"),
{{/each}}
            });

{{/if}}
{{#if isUrlEncoded}}
            // Build form-urlencoded content
            var content = new FormUrlEncodedContent(new[]
            {
{{#each body.urlencoded}}
                new KeyValuePair<string, string>("{{key}}", "{{value}}"),
{{/each}}
            });

{{/if}}
{{/if}}
            // Send request
            HttpResponseMessage response;
{{#if hasBody}}
            response = await client.{{method}}Async(fullUrl, content);
{{else}}
            response = await client.{{method}}Async(fullUrl);
{{/if}}

            // Read response
            var responseBody = await response.Content.ReadAsStringAsync();

            // Print response
            Console.WriteLine($"Status Code: {response.StatusCode}");
            Console.WriteLine($"Response Body: {responseBody}");
        }
        catch (Exception ex) {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}`)
};

const generatedCode = computed(() => {
  if (!props.context?.request) return '';
  
  const request = props.context.request;
  const { method, url, params, headers, body } = request;
  
  // Prepare data for templates
  const templateData = {
    method,
    methodLowerCase: method.toLowerCase(),
    url,
    fullUrl: url,
    params: params?.filter(p => p.enabled) || [],
    headers: headers?.filter(h => h.enabled) || [],
    body,
    hasBody: method !== 'GET' && method !== 'HEAD',
    isRaw: body?.type === 'raw',
    isJson: body?.rawType === 'json',
    isFormData: body?.type === 'form-data',
    isUrlEncoded: body?.type === 'x-www-form-urlencoded',
    formData: ''
  };
  
  // Build full URL with params
  if (templateData.params.length > 0) {
    const queryParams = templateData.params
      .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&');
    templateData.fullUrl = url + (url.includes('?') ? '&' : '?') + queryParams;
  }
  
  // Build form data for urlencoded
  if (templateData.isUrlEncoded && body?.urlencoded) {
    templateData.formData = body.urlencoded
      .filter((item: any) => item.enabled)
      .map((item: any) => `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`)
      .join('&');
  }
  
  // Get template for selected language
  const template = templates[selectedLanguage.value];
  if (!template) return '';
  
  return template(templateData);
});



function copyCode() {
  if (generatedCode.value) {
    navigator.clipboard.writeText(generatedCode.value)
      .then(() => {
        message.success('Code copied to clipboard');
      })
      .catch(() => {
        message.error('Failed to copy code');
      });
  }
}

watch(() => props.context, () => {
  // Reset language when context changes
  selectedLanguage.value = 'javascript';
});
</script>

<style scoped>
.code-generator-drawer {
  padding: 8px 0;
}

.language-selector {
  margin-bottom: 24px;
}

.code-output {
  margin-top: 16px;
}

.code-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

:deep(.n-code) {
  max-height: 400px;
  overflow: auto;
}
</style>