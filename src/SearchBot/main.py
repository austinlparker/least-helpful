import logging
import sys
import pprint
from signalrcore.hub_connection_builder import HubConnectionBuilder
from stackapi import StackAPI
from flair.data import Sentence
from flair.models import SequenceTagger

pp = pprint.PrettyPrinter(indent=4)
tagger = SequenceTagger.load('ner-ontonotes')
site = StackAPI('stackoverflow')

def check_user(message):
    if "@searchbot" in message[1]:
        trimmedMessage = message[1].replace('@searchbot', '')
        taggedMessage = tag_message(trimmedMessage)
        if len(taggedMessage.get_spans('ner')) >= 1:
            res = searchSpan(taggedMessage.get_spans('ner')[0].to_original_text)
        else:
            res = searchSpan(trimmedMessage)
        hub_connection.send("newMessage", [username, f"found: {res[1]} ({res[0]})"])

def tag_message(sourceText):
    sentence = Sentence(sourceText)
    tagger.predict(sentence)
    return sentence

def searchSpan(spanText):
    res = site.fetch('search', intitle=spanText)
    if len(res) > 0:
        for item in res['items']:
            return [item['link'], item['title']]
    return ["Not Found", ":("]


server_url = "ws://localhost:9000/hub"
username = "searchbot"

hub_connection = HubConnectionBuilder()\
    .with_url(server_url)\
    .configure_logging(logging.DEBUG)\
    .with_automatic_reconnect({
        "type": "raw",
        "keep_alive_interval": 10,
        "reconnect_interval": 5,
        "max_attempts": 5
    }).build()

hub_connection.on_open(lambda: print("connection opened and handshake received ready to send messages"))
hub_connection.on_close(lambda: print("connection closed"))

hub_connection.on("messageReceived", check_user)
hub_connection.start()
message = None

# Do login

while message != "exit()":
    message = input(">> ")
    if message is not None and message is not "" and message is not "exit()":
        hub_connection.send("newMessage", [username, message])

hub_connection.stop()

sys.exit(0)