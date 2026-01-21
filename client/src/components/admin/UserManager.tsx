import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BilingualText } from '@/components/ui/bilingual-text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, Search } from 'lucide-react';

interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  studyHours?: number;
  totalStudyHours?: number;
  isActive: boolean;
  subscription?: 'free' | 'premium';
}

export default function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'premium'>('all');

  useEffect(() => {
    loadUsers();
  }, [filter]);

  async function loadUsers() {
    setLoading(true);
    try {
      let q = collection(db, 'users');
      
      if (filter === 'active') {
        q = query(collection(db, 'users'), where('isActive', '==', true));
      } else if (filter === 'inactive') {
        q = query(collection(db, 'users'), where('isActive', '==', false));
      } else if (filter === 'premium') {
        q = query(collection(db, 'users'), where('subscription', '==', 'premium'));
      }
      
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
      } as User));
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserStatus(userId: string, currentStatus: boolean) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: !currentStatus,
        updatedAt: new Date().toISOString()
      });
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Kullanıcı güncellenirken hata oluştu');
    }
  }

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <BilingualText text="Kullanıcı Yönetimi – User Management" />
            </CardTitle>
            <Badge variant="secondary">{users.length} kullanıcı</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
            >
              <option value="all">Tümü</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                    Kullanıcı
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                    Durum
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                    Çalışma Saati
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                        <p>Henüz kullanıcı bulunmuyor</p>
                        <p className="text-sm">Kullanıcılar kayıt oldukça burada görünecek</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {user.displayName || 'İsimsiz Kullanıcı'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Kayıt: {user.createdAt.toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        {user.isActive ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <UserX className="h-3 w-3 mr-1" />
                            Pasif
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {user.studyHours || user.totalStudyHours || 0} saat
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant={user.isActive ? 'outline' : 'default'}
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                        >
                          {user.isActive ? 'Devre Dışı Bırak' : 'Aktif Et'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Statistics */}
          {filteredUsers.length > 0 && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t dark:border-slate-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {users.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Toplam</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.isActive).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Aktif</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.subscription === 'premium').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Premium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.round(users.reduce((sum, u) => sum + (u.studyHours || u.totalStudyHours || 0), 0))}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Toplam Saat</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
