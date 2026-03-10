# OAuth Authentication App

This project implements login and registration functionality using Google and Apple authentication. It is built with TypeScript and Express.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Routes](#routes)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/metinbagdat/learnconnect-.git
   cd oauth-auth-app
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file and fill in your OAuth credentials.

## Configuration

The application uses environment variables for configuration. Make sure to set the following variables in your `.env` file:

- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID.
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret.
- `APPLE_CLIENT_ID`: Your Apple OAuth client ID.
- `APPLE_TEAM_ID`: Your Apple team ID.
- `APPLE_KEY_ID`: Your Apple key ID.
- `APPLE_PRIVATE_KEY`: Your Apple private key.

## Usage

To start the application, run:
```
npm start
```

The application will be available at `http://localhost:3000`.

## Routes

The following routes are available for authentication:

- `POST /auth/google/login`: Login with Google.
- `POST /auth/apple/login`: Login with Apple.
- `POST /auth/google/register`: Register with Google.
- `POST /auth/apple/register`: Register with Apple.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.