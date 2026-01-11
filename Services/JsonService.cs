using System; using System.Collections.Generic; using Newtonsoft.Json; using Newtonsoft.Json.Linq; using Teapot.Models;

namespace Teapot.Services
{
    public class JsonService : IJsonService
    {
        public List<JsonTreeNode> ParseJson(string jsonString)
        {
            var result = new List<JsonTreeNode>();
            if (string.IsNullOrWhiteSpace(jsonString))
                return result;

            try
            {
                var token = JToken.Parse(jsonString);
                ProcessToken(token, "root", result);
            }
            catch (JsonException)
            {
                // 如果JSON解析失败，返回空列表
                return result;
            }

            return result;
        }

        public string SerializeJson(List<JsonTreeNode> nodes)
        {
            if (nodes == null || nodes.Count == 0)
                return string.Empty;

            try
            {
                var rootToken = BuildToken(nodes[0].Children);
                return rootToken.ToString(Formatting.Indented);
            }
            catch (Exception)
            {
                // 如果序列化失败，返回空字符串
                return string.Empty;
            }
        }

        private void ProcessToken(JToken token, string name, List<JsonTreeNode> parent)
        {
            var node = new JsonTreeNode { Name = name };

            switch (token.Type)
            {
                case JTokenType.Object:
                    node.Type = "object";
                    node.HasChildren = true;
                    foreach (var prop in token.Children<JProperty>())
                    {
                        ProcessToken(prop.Value, prop.Name, node.Children);
                    }
                    break;

                case JTokenType.Array:
                    node.Type = "array";
                    node.HasChildren = true;
                    var array = token as JArray;
                    for (int i = 0; i < array.Count; i++)
                    {
                        ProcessToken(array[i], i.ToString(), node.Children);
                    }
                    break;

                case JTokenType.String:
                    node.Type = "string";
                    node.Value = token.ToString();
                    break;

                case JTokenType.Integer:
                    node.Type = "number";
                    node.Value = token.ToString();
                    break;

                case JTokenType.Float:
                    node.Type = "number";
                    node.Value = token.ToString();
                    break;

                case JTokenType.Boolean:
                    node.Type = "boolean";
                    node.Value = token.ToString().ToLower();
                    break;

                case JTokenType.Null:
                    node.Type = "null";
                    node.Value = "null";
                    break;

                default:
                    node.Type = "unknown";
                    node.Value = token.ToString();
                    break;
            }

            parent.Add(node);
        }

        private JToken BuildToken(List<JsonTreeNode> nodes)
        {
            if (nodes == null || nodes.Count == 0)
                return new JObject();

            // 检查是否为数组
            bool isArray = true;
            for (int i = 0; i < nodes.Count; i++)
            {
                if (nodes[i].Name != i.ToString())
                {
                    isArray = false;
                    break;
                }
            }

            if (isArray)
            {
                var array = new JArray();
                foreach (var node in nodes)
                {
                    array.Add(BuildTokenValue(node));
                }
                return array;
            }
            else
            {
                var obj = new JObject();
                foreach (var node in nodes)
                {
                    obj[node.Name] = BuildTokenValue(node);
                }
                return obj;
            }
        }

        private JToken BuildTokenValue(JsonTreeNode node)
        {
            if (node.HasChildren)
            {
                return BuildToken(node.Children);
            }

            switch (node.Type)
            {
                case "string":
                    return new JValue(node.Value);

                case "number":
                    if (double.TryParse(node.Value, out var number))
                        return new JValue(number);
                    break;

                case "boolean":
                    if (bool.TryParse(node.Value, out var boolean))
                        return new JValue(boolean);
                    break;

                case "null":
                    return JValue.CreateNull();
            }

            return new JValue(node.Value);
        }
    }
}