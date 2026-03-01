"use client"

import { useState } from "react"
import {
  ShieldCheck,
  MapPin,
  Pencil,
  LogOut,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { useAppStore } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export function UserProfile() {
  const { currentUser, updateProfile } = useAppStore()
  const { logout } = useAuth()
  const [editName, setEditName] = useState(currentUser.name)
  const [editBio, setEditBio] = useState(currentUser.bio)
  const [editAge, setEditAge] = useState(String(currentUser.age))

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  function handleSaveProfile() {
    updateProfile({
      name: editName,
      bio: editBio,
      age: parseInt(editAge) || currentUser.age,
    })
    toast.success("Profile updated!")
  }

  function handleLogout() {
    logout()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profile header */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="h-24 w-24 border-2 border-primary/30">
            <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <Drawer>
            <DrawerTrigger asChild>
              <button
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary"
                aria-label="Edit profile"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </DrawerTrigger>
            <DrawerContent className="border-border bg-card">
              <DrawerHeader>
                <DrawerTitle className="text-foreground">Edit Profile</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col gap-4 px-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border-border bg-secondary text-foreground"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Age</Label>
                  <Input
                    type="number"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="border-border bg-secondary text-foreground"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Bio</Label>
                  <Textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="min-h-[80px] border-border bg-secondary text-foreground"
                  />
                </div>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button
                    onClick={handleSaveProfile}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Save Changes
                  </Button>
                </DrawerClose>
                <DrawerClose asChild>
                  <Button variant="outline" className="border-border text-muted-foreground">
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-bold text-foreground">
              {currentUser.name}
            </h1>
            {currentUser.verified && (
              <ShieldCheck className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{currentUser.age}</span>
            <span>&middot;</span>
            <span className="capitalize">
              {currentUser.gender === "prefer-not-to-say"
                ? "Not specified"
                : currentUser.gender}
            </span>
          </div>
        </div>

        {currentUser.verified ? (
          <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/10">
            <ShieldCheck className="h-3 w-3" />
            Verified User
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 border-accent/40 text-accent">
            <ShieldCheck className="h-3 w-3" />
            Verify your account
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-1 rounded-xl bg-secondary/50 p-4">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold text-foreground">
              {currentUser.tripsCompleted}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Trips Completed</span>
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Bio */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground">About</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {currentUser.bio}
        </p>
      </div>

      <Separator className="bg-border" />

      {/* Logout */}
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )
}
