const testOne = document.getElementById('testOne');
const websocketButton = document.getElementById('websocketButton');
const cancelHook = document.getElementById('cancelHook');

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

cancelHook.addEventListener('click', () => {
  const request = new XMLHttpRequest();
  request.open('GET', 'http://localhost:8080/secure');
  request.setRequestHeader('Content-Type', 'application/json');
  request.send();

  request.onreadystatechange = () => {
    if (request.readyState === XMLHttpRequest.DONE) {
      alert(request.responseText);
    }
  };
});
