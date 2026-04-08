<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Focus Assistant</title>
<link rel="stylesheet" href="style_ia.css">
</head>
<body>

<!-- Botão flutuante -->
<div class="chat-button" onclick="toggleChat()">💬</div>

<!-- Caixa de chat -->
<div class="chat-box" id="chatBox">

    <div class="chat-header">
        🐰 Focus Assistant
    </div>

    <div class="chat-messages" id="messages">
        <!-- Mensagem inicial -->
        <p><b>🐰 Assistente:</b> Olá! Como posso te ajudar a subir de nível nos estudos hoje? 🎮</p>
    </div>

    <div class="chat-input">
        <input id="input" placeholder="Digite sua pergunta">
        <button onclick="sendMessage()">➤</button>
    </div>

</div>

<script src="script_ia.js"></script>
</body>
</html>