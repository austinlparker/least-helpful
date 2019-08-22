import React, { Component } from 'react';
import * as signalR from '@aspnet/signalr';

class Chat extends Component {
    constructor(props) {
        super(props);
        this.state = {
            nickname: '',
            message: '',
            messages: [],
            hub: null,
            typers: [],
        };
    }

    componentDidMount = () => {
        const nickname = window.prompt('Enter your name:', 'User');
        const hub = new signalR.HubConnectionBuilder().withUrl('http://localhost:9000/hub').configureLogging(signalR.LogLevel.Information).build();

        this.setState({hub, nickname}, () => {
            this.state.hub
                .start()
                .then(() => console.log('connected'))
                .catch(err => console.error('error establishing connection: ', err));
            this.state.hub.on('messageReceived', (name, message) => {
                const text = `${name}: ${message}`;
                const messages = this.state.messages.concat([text]);
                this.setState({ messages });
            });
            this.state.hub.on('hasStartedTyping', (name) => {
                console.log('received starttyping')
                if (name !== this.state.nickname) {
                    if (!this.state.typers.includes(name)) {
                        const typers = this.state.typers.concat([name])
                        this.setState({ typers });
                    }
                }
            });
            this.state.hub.on('hasStoppedTyping', (name) => {
                if (name !== this.state.nickname) {
                    const typers = this.state.typers.filter(t => t !== name);
                    this.setState({ typers });
                }
            })
        });
    }

    isTyping = () => {
        this.state.hub
            .invoke('userStartedTyping', this.state.nickname)
            .catch(err => console.error(err))
    }

    stoppedTyping = () => {
        this.state.hub
            .invoke('userStoppedTyping', this.state.nickname)
            .catch(err => console.error(err))
    }

    sendMessage = () => {
        this.state.hub
            .invoke('newMessage', this.state.nickname, this.state.message)
            .catch(err => console.error(err));

        this.setState({ message: '' });
    }

    render() {
        return (
            <div>
                <input type="text" value={this.state.message} onChange={evt => {
                    this.isTyping()
                    this.setState({ message: evt.target.value })
                    setTimeout(() => { this.stoppedTyping() }, 5000);
                    }} />
                <button onClick={this.sendMessage}>Send</button>
                <div>
                    Typing: 
                    {this.state.typers.map((user, idx) => (
                        <span key={idx}>{user}</span>
                    ))}
                </div>
                <div>
                    {this.state.messages.map((msg, idx) => (
                        <span style={{display: 'block'}} key={idx}>{msg}</span>
                    ))}
                </div>
            </div>
        );
    }
}

export default Chat;