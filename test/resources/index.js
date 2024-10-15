const testOne = document.getElementById('testOne');
const websocketButton = document.getElementById('websocketButton');

testOne.addEventListener('click', () => {
  const request = new XMLHttpRequest();
  request.open('POST', 'http://localhost:8080/');
  request.setRequestHeader('Content-Type', 'application/json');
  request.send(JSON.stringify({ test: 'test' }));
});

websocketButton.addEventListener('click', () => {
  const socket = new WebSocket('ws://localhost:8080/ws');

  socket.onopen = () => {
    socket.send(JSON.stringify({ test: 'test' }));
  };

  socket.onmessage = (event) => {
    console.log(event.data);

    socket.send(JSON.stringify({ test: 'test1233444' }));
    socket.close();

    console.log('closed');
  };
});
