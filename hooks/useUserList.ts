"use client"

import { useState, useEffect, useMemo } from "react"
import type { UserType } from "@/features/auth/types/user.types"
import type { FilterRole } from "@/types/admin.types"
import { USER_LIST_LIMIT } from "@/lib/constants/users"

export function useUserList(
  initialUsers: UserType[],
  totalUsers: number,
  search: string,
  filterRole: FilterRole
) {
  const [users, setUsers] = useState<UserType[]>(initialUsers)
  const [displayedCount, setDisplayedCount] = useState(initialUsers.length)
  const [totalFromServer, setTotalFromServer] = useState(totalUsers)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setDisplayedCount(0)
      setUsers([])

      try {
        const params = new URLSearchParams()
        params.set("limit", String(USER_LIST_LIMIT))
        params.set("offset", "0")
        if (filterRole !== "all") params.set("role", filterRole)
        if (debouncedSearch) params.set("search", debouncedSearch)

        const res = await fetch(`/api/users?${params.toString()}`)
        const data = await res.json()

        if (data.users) {
          setUsers(data.users)
          setDisplayedCount(data.users.length)
          setTotalFromServer(data.total)
        }
      } catch (err) {
        console.error("Error fetching users:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [debouncedSearch, filterRole])

  const displayedUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = filterRole === "all" || user.role === filterRole
      return matchesRole
    })
  }, [users, filterRole])

  const loadMore = async () => {
    if (loadingMore || displayedCount >= totalFromServer) return

    setLoadingMore(true)
    try {
      const offset = displayedCount
      const params = new URLSearchParams()
      params.set("limit", String(USER_LIST_LIMIT))
      params.set("offset", String(offset))
      if (filterRole !== "all") params.set("role", filterRole)
      if (debouncedSearch) params.set("search", debouncedSearch)

      const res = await fetch(`/api/users?${params.toString()}`)
      const data = await res.json()

      if (data.users) {
        setUsers((prev) => [...prev, ...data.users])
        setDisplayedCount((prev) => prev + data.users.length)
      }
    } catch (err) {
      console.error("Error loading more users:", err)
    } finally {
      setLoadingMore(false)
    }
  }

  const hasMore = displayedCount < totalFromServer

  return {
    users,
    setUsers,
    displayedCount,
    totalFromServer,
    loading,
    loadingMore,
    displayedUsers,
    hasMore,
    loadMore,
  }
}
