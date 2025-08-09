'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/button';
import { LogOut, Bot, MessageSquare, Settings } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user.first_name} {user.last_name}</span>
            <Button 
              variant="outline" 
              onClick={() => logout().then(() => router.push('/login'))}
              className="flex items-center space-x-2 bg-red-600 text-white hover:bg-red-700 border-red-600 hover:border-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Logout</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Agents Card */}
              <Link href="/agents" className="block">
                <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">Agents</h3>
                        <p className="mt-1 text-sm text-gray-500">Create and manage your AI agents</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Chats Card */}
              <Link href="/chats" className="block">
                <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <MessageSquare className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">Chats</h3>
                        <p className="mt-1 text-sm text-gray-500">View and manage conversations</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Settings Card */}
              <Link href="/settings" className="block">
                <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                        <Settings className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">Settings</h3>
                        <p className="mt-1 text-sm text-gray-500">Configure your account</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Recent Activity Section */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <p className="text-center text-gray-500">No recent activity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
