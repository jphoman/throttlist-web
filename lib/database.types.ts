export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          bio: string | null
          avatar_url: string | null
          location: string | null
          instagram_handle: string | null
          youtube_handle: string | null
          is_pro: boolean
          build_style: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          bio?: string | null
          avatar_url?: string | null
          location?: string | null
          instagram_handle?: string | null
          youtube_handle?: string | null
          is_pro?: boolean
          build_style?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      builds: {
        Row: {
          id: string
          user_id: string
          year: number | null
          make: string
          model: string
          nickname: string | null
          slug: string | null
          cover_photo_url: string | null
          build_type: string | null
          status: string
          is_public: boolean
          follower_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          year?: number | null
          make: string
          model: string
          nickname?: string | null
          slug?: string | null
          cover_photo_url?: string | null
          build_type?: string | null
          status?: string
          is_public?: boolean
          follower_count?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['builds']['Insert']>
      }
      parts: {
        Row: {
          id: string
          build_id: string
          name: string
          category: string | null
          type: string
          source_url: string | null
          notes: string | null
          is_current: boolean
          replaced_by_part_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          build_id: string
          name: string
          category?: string | null
          type?: string
          source_url?: string | null
          notes?: string | null
          is_current?: boolean
          replaced_by_part_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['parts']['Insert']>
      }
      posts: {
        Row: {
          id: string
          user_id: string
          build_id: string | null
          photos: string[]
          caption: string | null
          tagged_part_ids: string[]
          like_count: number
          comment_count: number
          view_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          build_id?: string | null
          photos: string[]
          caption?: string | null
          tagged_part_ids?: string[]
          like_count?: number
          comment_count?: number
          view_count?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
      likes: {
        Row: { user_id: string; post_id: string; created_at: string }
        Insert: { user_id: string; post_id: string; created_at?: string }
        Update: never
      }
      comments: {
        Row: {
          id: string
          user_id: string
          post_id: string
          parent_id: string | null
          body: string
          likes: number
          is_pinned: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          parent_id?: string | null
          body: string
          likes?: number
          is_pinned?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['comments']['Insert']>
      }
      follows: {
        Row: { follower_id: string; following_id: string; created_at: string }
        Insert: { follower_id: string; following_id: string; created_at?: string }
        Update: never
      }
      views: {
        Row: { id: string; user_id: string | null; post_id: string; created_at: string }
        Insert: { id?: string; user_id?: string | null; post_id: string; created_at?: string }
        Update: never
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          body: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          body: string
          is_read?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
    }
  }
}
