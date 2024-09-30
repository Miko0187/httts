const testOne = document.getElementById('testOne');

testOne.addEventListener('click', () => {
  const request = new XMLHttpRequest();
  request.open('POST', 'http://localhost:8080/');
  request.setRequestHeader('Content-Type', 'application/json');
  request.send(JSON.stringify({ test: 'test' }));
});