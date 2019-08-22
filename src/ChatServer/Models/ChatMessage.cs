namespace ChatServer.Models
{
    public struct ChatMessage
    {
        public string username, message;
        
        public ChatMessage(string user, string msg)
        {
            username = user;
            message = msg;
        }
    }

}
