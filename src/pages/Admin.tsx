import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { db } from '@/services/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { logActivity } from '@/lib/logger';

const ADMIN_EMAILS = ['ahmadi67000@gmail.com'];

interface AllowedUser {
  id: string;
  emailOrUsername: string;
  password?: string;
  displayName: string;
  createdAt?: any;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  user: string;
  timestamp: any;
}

export function Admin() {
  const { currentUser } = useAuth();
  
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [userToDelete, setUserToDelete] = useState<{ id: string, emailOrUsername: string } | null>(null);
  
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
    displayName: ''
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = currentUser?.email && ADMIN_EMAILS.includes(currentUser.email);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadLogs();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'allowed_users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AllowedUser[];
      setUsers(loaded);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActivityLog[];
      setLogs(loaded);
    } catch (err) {
      console.error("Error loading logs:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      if (!formData.emailOrUsername || !formData.password || !formData.displayName) {
        throw new Error("Tous les champs sont obligatoires.");
      }
      
      await addDoc(collection(db, 'allowed_users'), {
        emailOrUsername: formData.emailOrUsername.trim(),
        password: formData.password,
        displayName: formData.displayName.trim(),
        createdBy: currentUser?.uid,
        createdAt: serverTimestamp()
      });
      
      logActivity('AJOUT_MEMBRE', `Création du compte membre ${formData.emailOrUsername}`, currentUser?.email || 'Inconnu');
      
      setSuccess("Accès membre créé avec succès.");
      setFormData({ emailOrUsername: '', password: '', displayName: '' });
      loadUsers();
      loadLogs();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (id: string, emailOrUsername: string) => {
    setUserToDelete({ id, emailOrUsername });
  };

  if (!currentUser) return <Navigate to="/" />;
  
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <h2 className="text-3xl font-bold text-red-600 mb-4">Accès refusé</h2>
        <p className="text-text-secondary">Cette page est réservée à l'administrateur.</p>
        <Button className="mt-8" onClick={() => window.history.back()}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Administration</h1>
          <p className="text-text-secondary mt-2">Gestion des accès membres</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-6">Créer un accès</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-md border border-green-100">
                {success}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Identifiant ou E-mail</label>
                <input 
                  type="text" 
                  name="emailOrUsername"
                  value={formData.emailOrUsername}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="ex: jean.dupont"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Mot de passe initial</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Nom complet</label>
                <input 
                  type="text" 
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="ex: Jean Dupont"
                />
              </div>
              
              <Button type="submit" disabled={formLoading} className="w-full pt-2">
                {formLoading ? 'Création...' : 'Créer l\'accès'}
              </Button>
            </form>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Accès existants ({users.length})</h2>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-text-secondary">Chargement...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">Aucun accès créé pour le moment.</div>
            ) : (
              <div className="divide-y divide-border">
                {users.map(user => (
                  <div key={user.id} className="p-6 flex items-center justify-between hover:bg-surface transition-colors">
                    <div>
                      <div className="font-semibold text-text-primary">{user.displayName}</div>
                      <div className="text-sm text-text-secondary mt-1">Identifiant : {user.emailOrUsername}</div>
                      <div className="text-sm text-text-secondary mt-1 flex items-center gap-2">
                        <span>Mot de passe : <span className="font-mono bg-accent/5 px-1 py-0.5 rounded">{visiblePasswords[user.id] ? user.password : '••••••••'}</span></span>
                        <button 
                          onClick={() => setVisiblePasswords(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                          className="text-text-tertiary hover:text-text-primary transition-colors focus:outline-none"
                          title={visiblePasswords[user.id] ? "Masquer" : "Afficher"}
                        >
                          {visiblePasswords[user.id] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                        </button>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(user.id, user.emailOrUsername)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
                    >
                      Supprimer
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-0 overflow-hidden mt-8">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Journal d'activité récent (Logs)</h2>
            </div>
            {logs.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">Aucune activité récente.</div>
            ) : (
              <div className="divide-y divide-border">
                {logs.map(log => (
                  <div key={log.id} className="p-6 flex flex-col sm:flex-row gap-4 sm:items-center hover:bg-surface transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                          {log.action}
                        </span>
                        <span className="text-sm font-medium text-text-primary">{log.user}</span>
                      </div>
                      <p className="text-sm text-text-secondary">{log.details}</p>
                    </div>
                    <div className="text-xs text-text-tertiary whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString('fr-FR') : 'À l\'instant'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
      
      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <h3 className="font-display text-lg font-bold text-text-primary">Supprimer l'accès</h3>
            <p className="text-sm text-text-secondary">
              Êtes-vous sûr de vouloir supprimer l'accès de <strong>{userToDelete.emailOrUsername}</strong> ?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserToDelete(null)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await deleteDoc(doc(db, 'allowed_users', userToDelete.id));
                    logActivity('SUPPRESSION_MEMBRE', `Suppression du compte membre ${userToDelete.emailOrUsername}`, currentUser?.email || 'Inconnu');
                    setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
                    loadLogs();
                  } catch (err) {
                    console.error("Error deleting user:", err);
                  } finally {
                    setUserToDelete(null);
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
