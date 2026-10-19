'use client';

import { useState, useEffect } from 'react';
import { listUsers, addUser, updatePassword, removeUser, isAdmin, getCurrentUser } from '@/lib/auth';

export default function AdminPage() {
  const [users, setUsers] = useState<Array<{ username: string; isAdmin: boolean }>>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isAdmin()) {
      window.location.href = '/';
      return;
    }
    setCurrentUser(getCurrentUser());
    setUsers(listUsers());
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!newUsername || !newPassword) {
      setMessage('Заполните все поля');
      return;
    }

    const success = await addUser(newUsername, newPassword, newIsAdmin);
    if (success) {
      setUsers(listUsers());
      setNewUsername('');
      setNewPassword('');
      setNewIsAdmin(false);
      setMessage(`Пользователь ${newUsername} добавлен`);
    } else {
      setMessage('Пользователь с таким именем уже существует');
    }
  };

  const handleUpdatePassword = async (username: string) => {
    setMessage('');

    if (!editPassword) {
      setMessage('Введите новый пароль');
      return;
    }

    const success = await updatePassword(username, editPassword);
    if (success) {
      setEditingUser(null);
      setEditPassword('');
      setMessage(`Пароль для ${username} обновлён`);
    } else {
      setMessage('Ошибка обновления пароля');
    }
  };

  const handleRemoveUser = (username: string) => {
    if (username === currentUser) {
      setMessage('Нельзя удалить самого себя');
      return;
    }

    if (confirm(`Удалить пользователя ${username}?`)) {
      const success = removeUser(username);
      if (success) {
        setUsers(listUsers());
        setMessage(`Пользователь ${username} удалён`);
      } else {
        setMessage('Ошибка удаления');
      }
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 600,
          color: '#1a1a1a',
        }}>
          Управление пользователями
        </h1>
        <a
          href="/"
          style={{
            padding: '10px 20px',
            background: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          ← Назад к графику
        </a>
      </div>

      {message && (
        <div style={{
          padding: '12px',
          background: message.includes('ошибка') || message.includes('нельзя') ? '#fee' : '#efe',
          border: `1px solid ${message.includes('ошибка') || message.includes('нельзя') ? '#fcc' : '#cfc'}`,
          borderRadius: '8px',
          color: message.includes('ошибка') || message.includes('нельзя') ? '#c33' : '#3c3',
          fontSize: '14px',
          marginBottom: '24px',
        }}>
          {message}
        </div>
      )}

      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '24px',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 600,
          marginBottom: '16px',
          color: '#333',
        }}>
          Добавить нового пользователя
        </h2>

        <form onSubmit={handleAddUser}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '16px',
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '8px',
                color: '#333',
              }}>
                Логин
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
                placeholder="username"
                required
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '8px',
                color: '#333',
              }}>
                Пароль
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
                placeholder="password"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#333',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={newIsAdmin}
                onChange={(e) => setNewIsAdmin(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Администратор (может управлять пользователями)
            </label>
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 24px',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Добавить пользователя
          </button>
        </form>
      </div>

      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 600,
          marginBottom: '16px',
          color: '#333',
        }}>
          Список пользователей ({users.length})
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {users.map((user) => (
            <div
              key={user.username}
              style={{
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: editingUser === user.username ? '12px' : '0',
              }}>
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#333',
                  }}>
                    {user.username}
                    {user.isAdmin && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        background: '#0070f3',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}>
                        Админ
                      </span>
                    )}
                    {user.username === currentUser && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        background: '#28a745',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}>
                        Вы
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setEditingUser(editingUser === user.username ? null : user.username)}
                    style={{
                      padding: '8px 16px',
                      background: editingUser === user.username ? '#6c757d' : '#ffc107',
                      color: editingUser === user.username ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {editingUser === user.username ? 'Отмена' : 'Изменить пароль'}
                  </button>
                  <button
                    onClick={() => handleRemoveUser(user.username)}
                    disabled={user.username === currentUser}
                    style={{
                      padding: '8px 16px',
                      background: user.username === currentUser ? '#e0e0e0' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: user.username === currentUser ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>

              {editingUser === user.username && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px',
                }}>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Новый пароль"
                    style={{
                      flex: 1,
                      padding: '8px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                    }}
                  />
                  <button
                    onClick={() => handleUpdatePassword(user.username)}
                    style={{
                      padding: '8px 16px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Сохранить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
