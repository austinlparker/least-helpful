using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.StackExchangeRedis;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Threading.Tasks;
using ChatServer.Models;

namespace ChatServer.Hubs
{
    public class ChatHub : Hub
    {
        private MemoryCache _cache;
        
        public ChatHub(ChatCache memoryCache)
        {
            _cache = memoryCache.cache;
        }

        public override async Task OnConnectedAsync()
        {
            ChatMessage message;
            for (var i = 0; i < 50; i++)
            {
                if(_cache.TryGetValue(i, out message))
                {
                    await Clients.Caller.SendAsync("messageReceived", message.username, message.message);
                }
            }
            await base.OnConnectedAsync();
        }

        public async Task UserStartedTyping(string username)
        {
            await Clients.All.SendAsync("hasStartedTyping", username);
        }

        public async Task UserStoppedTyping(string username)
        {
            await Clients.All.SendAsync("hasStoppedTyping", username);
        }
        
        public async Task NewMessage(string username, string message)
        {
            AddMessageToCache(username, message);
            await Clients.All.SendAsync("messageReceived", username, message);
        }

        private void AddMessageToCache(string username, string message)
        {

            var msg = new ChatMessage(username, message);
            var cacheOptions = new MemoryCacheEntryOptions().SetSize(1).SetSlidingExpiration(TimeSpan.FromMinutes(5));
            for (var i = 0; i < 50; i++) 
            {
                if (!_cache.TryGetValue(i, out ChatMessage _)) 
                {
                    _cache.Set(i, msg, cacheOptions);
                    break;
                }
                if (_cache.TryGetValue(50, out ChatMessage _))
                {
                    _cache.Set(50, msg, cacheOptions);
                    _cache.Compact(.25);
                }
            }
        }
    }
}