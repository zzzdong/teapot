using System.Collections.Generic;
using Teapot.Models;

namespace Teapot.Services
{
    public interface IJsonService
    {
        List<JsonTreeNode> ParseJson(string jsonString);
        string SerializeJson(List<JsonTreeNode> nodes);
    }
}