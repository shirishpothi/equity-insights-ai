import { NextRequest, NextResponse } from 'next/server';
import { getFeatureFlagService, isFeatureEnabled, FEATURE_FLAGS } from '@/lib/feature-flags';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Check if user has admin access
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if feature flag management is enabled for this user
    if (!isFeatureEnabled(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT, {
      userId: user.id,
      userEmail: user.email,
    })) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const service = getFeatureFlagService();
    const allFlags = service.getAllFlags({
      userId: user.id,
      userEmail: user.email,
    });

    return NextResponse.json({
      success: true,
      data: {
        flags: allFlags,
        config: service.getConfig(),
      }
    });

  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user has admin access
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if feature flag management is enabled for this user
    if (!isFeatureEnabled(FEATURE_FLAGS.ADMIN_FEATURE_FLAG_MANAGEMENT, {
      userId: user.id,
      userEmail: user.email,
    })) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, flagKey, updates } = body;

    const service = getFeatureFlagService();

    switch (action) {
      case 'toggle':
        const toggleSuccess = service.toggleFlag(flagKey);
        if (toggleSuccess) {
          return NextResponse.json({
            success: true,
            message: `Flag ${flagKey} toggled successfully`
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Failed to toggle flag' },
            { status: 400 }
          );
        }

      case 'update':
        const updateSuccess = service.updateFlag(flagKey, updates);
        if (updateSuccess) {
          return NextResponse.json({
            success: true,
            message: `Flag ${flagKey} updated successfully`
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Failed to update flag' },
            { status: 400 }
          );
        }

      case 'setPercentage':
        const { percentage } = body;
        const percentageSuccess = service.setFlagPercentage(flagKey, percentage);
        if (percentageSuccess) {
          return NextResponse.json({
            success: true,
            message: `Flag ${flagKey} percentage set to ${percentage}%`
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Failed to set percentage' },
            { status: 400 }
          );
        }

      case 'addUser':
        const { userId, userEmail } = body;
        const addUserSuccess = service.addUserToFlag(flagKey, userId, userEmail);
        if (addUserSuccess) {
          return NextResponse.json({
            success: true,
            message: `User added to flag ${flagKey}`
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Failed to add user to flag' },
            { status: 400 }
          );
        }

      case 'removeUser':
        const { userId: removeUserId, userEmail: removeUserEmail } = body;
        const removeUserSuccess = service.removeUserFromFlag(flagKey, removeUserId, removeUserEmail);
        if (removeUserSuccess) {
          return NextResponse.json({
            success: true,
            message: `User removed from flag ${flagKey}`
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Failed to remove user from flag' },
            { status: 400 }
          );
        }

      case 'refresh':
        service.refreshConfig();
        return NextResponse.json({
          success: true,
          message: 'Configuration refreshed successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error updating feature flags:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
