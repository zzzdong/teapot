namespace Teapot.Models
{
    public static class HttpConstants
    {
        public static readonly string[] Methods = { "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS" };
        public static readonly string[] AuthTypes = { "none", "Basic", "Bearer Token" };
        public static readonly string[] BodyTypes = { "none", "raw", "form-data", "x-www-form-urlencoded" };
    }
}
