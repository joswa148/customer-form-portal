(async () => {
  try {
    const response = await fetch('http://localhost:5002/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formId: 1,
        userPhone: '+971 50 123 4567',
        answers: {
          'field_b51b1e6c': ['VAT Filing'],
          'field_4550476a': 'Satisfied (3)'
        }
      })
    });
    const data = await response.json();
    console.log(JSON.stringify(data));
  } catch (err) {
    console.error(err.message);
  }
})();
