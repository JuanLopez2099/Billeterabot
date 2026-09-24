import '../styles/auth.css';

function AuthLayout({ titulo, subtitulo, children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-badge">B</div>
          <span className="auth-logo-text">Billeterabot</span>
        </div>
        <h1 className="auth-title">{titulo}</h1>
        {subtitulo && <p className="auth-subtitle">{subtitulo}</p>}
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;