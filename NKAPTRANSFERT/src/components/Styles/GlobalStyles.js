import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Poppins', sans-serif;
  }

  body {
    background-color: #F4F6F6;
    color: #2C3E50;
    line-height: 1.6;
  }

  h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #2C3E50;
  }

  .container {
    max-width: 500px;
    margin: 50px auto;
    padding: 20px;
    background: #FFFFFF;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-label {
    font-size: 14px;
    font-weight: 600;
    color: #2C3E50;
    margin-bottom: 5px;
    display: block;
  }

  .form-control {
    width: 100%;
    padding: 10px;
    font-size: 16px;
    border: 1px solid #DDD;
    border-radius: 5px;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }

  .form-control:focus {
    border-color: #16A085;
    box-shadow: 0 0 5px rgba(22, 160, 133, 0.3);
    outline: none;
  }

  .btn-primary {
    background-color: #16A085;
    border: none;
    padding: 12px 20px;
    font-size: 16px;
    font-weight: 600;
    color: #FFFFFF;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    width: 100%;
  }

  .btn-primary:hover {
    background-color: #13856f;
  }

  .btn-primary:disabled {
    background-color: #A9A9A9;
    cursor: not-allowed;
  }

  .text-danger {
    color: #E74C3C;
    font-size: 14px;
    margin-top: 10px;
  }

  .link-button {
    color: #16A085;
    text-decoration: none;
    font-size: 14px;
    margin-top: 15px;
    display: inline-block;
  }

  .link-button:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .container {
      margin: 20px;
      padding: 15px;
    }
  }
`;