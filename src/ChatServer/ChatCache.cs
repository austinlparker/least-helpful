using Microsoft.Extensions.Caching.Memory;

namespace ChatServer
{
    public class ChatCache
    {
        public MemoryCache cache { get; set; }
        public ChatCache()
        {
            cache = new MemoryCache(new MemoryCacheOptions
            {
                SizeLimit = 50
            });
        }
    }
}