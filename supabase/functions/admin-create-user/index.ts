/**
 * Edge Function: إنشاء مستخدم جديد
 * 
 * هذه الدالة تحل محل استخدام Service Key في الكود الأمامي
 * تعمل كـ Proxy آمن بين التطبيق و Supabase Admin API
 * 
 * لنشرها:
 * 1. تأكد من تثبيت supabase CLI
 * 2. قم بتشغيل: supabase functions deploy admin-create-user
 * 3. قم بتعيين secret: SUPABASE_SERVICE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const serviceKey = Deno.env.get('SUPABASE_SERVICE_KEY') || ''

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface CreateUserPayload {
  email: string
  password: string
  fullName: string
  role: string
  department?: string
  position?: string
  phone?: string
}

interface UpdateUserPayload {
  userId: string
  email?: string
  fullName?: string
  role?: string
  department?: string
  position?: string
  phone?: string
  status?: string
}

interface DeleteUserPayload {
  userId: string
}

serve(async (req) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin or developer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'developer'].includes(profile.role)) {
      throw new Error('Insufficient permissions. Only admins and developers can manage users.')
    }

    const body = await req.json()
    const { action } = body

    let result

    switch (action) {
      case 'create': {
        const payload = body.data as CreateUserPayload
        const nameParts = payload.fullName.trim().split(' ')
        const firstName = nameParts[0] || payload.fullName
        const lastName = nameParts.slice(1).join(' ') || ''

        // Create user in auth.users
        const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
          email: payload.email,
          password: payload.password,
          email_confirm: true,
          user_metadata: {
            full_name: payload.fullName,
            first_name: firstName,
            last_name: lastName,
            role: payload.role,
          },
        })

        if (createError) throw createError

        result = { success: true, data: createdUser }
        break
      }

      case 'update': {
        const payload = body.data as UpdateUserPayload
        
        // Update auth metadata
        if (payload.fullName || payload.role) {
          const metadata: Record<string, string> = {}
          if (payload.fullName) {
            const nameParts = payload.fullName.trim().split(' ')
            metadata.full_name = payload.fullName
            metadata.first_name = nameParts[0] || payload.fullName
            metadata.last_name = nameParts.slice(1).join(' ') || ''
          }
          if (payload.role) metadata.role = payload.role
          
          await supabase.auth.admin.updateUserById(payload.userId, {
            user_metadata: metadata,
          })
        }

        // Update profile
        const profileUpdate: Record<string, any> = {}
        if (payload.fullName) profileUpdate.full_name = payload.fullName
        if (payload.role) profileUpdate.role = payload.role
        if (payload.department) profileUpdate.department = payload.department
        if (payload.position) profileUpdate.position = payload.position
        if (payload.phone) profileUpdate.phone = payload.phone
        if (payload.status) profileUpdate.status = payload.status

        if (Object.keys(profileUpdate).length > 0) {
          await supabase.from('profiles').update(profileUpdate).eq('id', payload.userId)
        }

        result = { success: true }
        break
      }

      case 'delete': {
        const payload = body.data as DeleteUserPayload
        
        // Delete related records first
        await supabase.from('employee_skills').delete().eq('employee_id', payload.userId).maybeSingle()
        await supabase.from('employee_certifications').delete().eq('employee_id', payload.userId).maybeSingle()
        await supabase.from('employees').delete().eq('user_id', payload.userId).maybeSingle()
        await supabase.from('profiles').delete().eq('id', payload.userId).maybeSingle()
        
        // Delete auth user
        await supabase.auth.admin.deleteUser(payload.userId)
        
        result = { success: true }
        break
      }

      case 'list': {
        const { data: users, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError
        result = { success: true, data: users }
        break
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), { headers, status: 200 })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers, status: 400 }
    )
  }
})