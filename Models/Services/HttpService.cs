using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using Teapot.Models.Interfaces;
using Newtonsoft.Json;
using System.Linq;

namespace Teapot.Models.Services
{
    public class HttpService : IHttpService
    {
        private readonly HttpClient _httpClient;

        public HttpService()
        {
            _httpClient = new HttpClient();
        }

        public async Task<HttpResponseModel> SendRequestAsync(HttpRequestModel request)
        {
            var startTime = DateTime.Now;

            try
            {
                // 构建完整URL（包括查询参数）
                var uriBuilder = new UriBuilder(request.Url);
                var query = HttpUtility.ParseQueryString(uriBuilder.Query);
                
                foreach (var param in request.QueryParameters ?? new List<Parameter>())
                {
                    if (param.IsActive)
                    {
                        query[param.Key] = param.Value;
                    }
                }
                
                uriBuilder.Query = query.ToString();
                var fullUrl = uriBuilder.ToString();

                // 创建请求消息
                var httpRequest = new HttpRequestMessage
                {
                    Method = new HttpMethod(request.Method),
                    RequestUri = new Uri(fullUrl)
                };

                // 添加请求头
                foreach (var header in request.Headers ?? new List<Header>())
                {
                    if (header.IsActive)
                    {
                        httpRequest.Headers.Add(header.Key, header.Value);
                    }
                }

                // 添加认证头
                if (request.Authentication != null)
                {
                    switch (request.Authentication.Type)
                    {
                        case "basic":
                            var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{request.Authentication.Username}:{request.Authentication.Password}"));
                            httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", credentials);
                            break;
                        case "bearer":
                            httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.Authentication.Token);
                            break;
                    }
                }

                // 添加请求体
                if (!string.IsNullOrEmpty(request.Body) && request.BodyType != "none")
                {
                    httpRequest.Content = new StringContent(request.Body, Encoding.UTF8, GetContentType(request.BodyType));
                }

                // 发送请求
                var response = await _httpClient.SendAsync(httpRequest);
                
                // 计算响应时间
                var responseTime = DateTime.Now - startTime;

                // 读取响应内容
                var responseBody = await response.Content.ReadAsStringAsync();

                // 构建响应模型
                var responseModel = new HttpResponseModel
                {
                    RequestId = request != null ? request.Id.ToString() : "0", // 修复CS0019错误
                    StatusCode = (int)response.StatusCode,
                    StatusDescription = response.ReasonPhrase,
                    Body = responseBody,
                    ContentType = response.Content.Headers.ContentType?.ToString() ?? string.Empty,
                    ContentLength = response.Content.Headers.ContentLength.GetValueOrDefault(0),
                    ResponseTime = responseTime
                };

                // 添加响应头
                foreach (var header in response.Headers)
                {
                    var headerValue = string.Join(", ", header.Value) ?? string.Empty;
                    var headerKey = header.Key ?? string.Empty;
                    responseModel.Headers.Add(new ResponseHeader { Key = headerKey, Value = headerValue });
                    // 修复CS8601警告：确保使用非null值
                    responseModel.HeadersDict[headerKey] = headerValue;
                }

                foreach (var header in response.Content.Headers)
                {
                    var headerKey = header.Key ?? string.Empty;
                    if (!responseModel.HeadersDict.ContainsKey(headerKey))
                    {
                        var headerValue = string.Join(", ", header.Value) ?? string.Empty;
                        responseModel.Headers.Add(new ResponseHeader { Key = headerKey, Value = headerValue });
                        // 修复CS8601警告：确保使用非null值
                        responseModel.HeadersDict[headerKey] = headerValue;
                    }
                }

                // 解析Cookies
                if (response.Headers.TryGetValues("Set-Cookie", out var cookieValues))
                {
                    foreach (var cookieValue in cookieValues)
                    {
                        // 简单解析Cookie值
                        var parts = cookieValue.Split(';');
                        if (parts.Length > 0)
                        {
                            var nameValue = parts[0].Split('=');
                            if (nameValue.Length == 2)
                            {
                                responseModel.Cookies.Add(new Cookie
                                {
                                    Name = nameValue[0].Trim(),
                                    Value = nameValue[1].Trim()
                                });
                            }
                        }
                    }
                }

                return responseModel;
            }
            catch (Exception ex)
            {
                return new HttpResponseModel
                {
                    RequestId = request != null ? request.Id.ToString() : "0", // 修复CS0019错误
                    StatusCode = 0,
                    StatusDescription = ex.Message,
                    Body = ex.ToString(),
                    ResponseTime = DateTime.Now - startTime
                };
            }
        }

        private string GetContentType(string bodyType)
        {
            return bodyType.ToLower() switch
            {
                "json" => "application/json",
                "xml" => "application/xml",
                "form" => "application/x-www-form-urlencoded",
                _ => "text/plain"
            };
        }
    }
}