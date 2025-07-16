'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Mail, Calendar, Shield, Edit, Save, X } from 'lucide-react'
import Link from 'next/link'
import { profileService, type UserProfile } from '@/lib/profile-service'

function ProfileContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    avatar_url: ''
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const result = await profileService.getProfile(user.id)
      if (result.success && result.data) {
        setProfile(result.data)
        setEditForm({
          full_name: result.data.full_name || '',
          avatar_url: result.data.avatar_url || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to load profile data.',
        variant: 'destructive',
      })
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const result = await profileService.updateProfile(user.id, {
        full_name: editForm.full_name || null,
        avatar_url: editForm.avatar_url || null
      })

      if (result.success && result.data) {
        setProfile(result.data)
        setIsEditing(false)
        toast({
          title: 'Success',
          description: 'Profile updated successfully.',
        })
      } else {
        throw new Error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || ''
      })
    }
  }

  if (!user) return null

  const displayName = profile?.full_name || user.user_metadata?.full_name || 'User'
  const displayAvatar = profile?.avatar_url || user.user_metadata?.avatar_url

  const userInitials = displayName
    ? displayName
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || 'U'

  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your personal details and account status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={displayAvatar}
                      alt={displayName}
                    />
                    <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="avatar_url">Avatar URL</Label>
                          <Input
                            id="avatar_url"
                            value={editForm.avatar_url}
                            onChange={(e) => setEditForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                            placeholder="Enter avatar URL"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold">
                          {displayName}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            <Shield className="mr-1 h-3 w-3" />
                            Verified
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        size="sm"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="sm"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Email Address</span>
                  </div>
                  <p className="font-medium">{user.email}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Member Since</span>
                  </div>
                  <p className="font-medium">{joinDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Manage your account and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/history">
                  View Analysis History
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  )
}
