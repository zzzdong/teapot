using System;
using System.Collections.Generic;

namespace Teapot.Models
{
    public class CollectionModel
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Version { get; set; } = "1.0.0";
        public List<FolderModel> Folders { get; set; } = new();
        public List<HttpRequestModel> Requests { get; set; } = new();
        public List<EnvironmentModel> Environments { get; set; } = new();
        public List<HttpRequestModel> History { get; set; } = new();
    }

    public class FolderModel
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<HttpRequestModel> Requests { get; set; } = new();
        public List<FolderModel> SubFolders { get; set; } = new();
    }
}