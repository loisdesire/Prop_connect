import supabase from './_supabase.js';

async function seedRealtor() {
  try {
    // Step 1: Create the auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'gracewumi1@gmail.com',
      password: '123456',
      user_metadata: {
        role: 'realtor',
        first_name: 'Grace',
        last_name: 'Wumi',
      },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return;
    }

    console.log('✓ Auth user created:', authUser.id);

    // Step 2: Create a profile entry
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authUser.id,
          email: 'gracewumi1@gmail.com',
          first_name: 'Grace',
          last_name: 'Wumi',
          role: 'realtor',
        },
      ])
      .select();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return;
    }

    console.log('✓ Profile created:', profile[0].id);
    console.log('\n🎉 Realtor account created successfully!');
    console.log('Email: gracewumi1@gmail.com');
    console.log('Password: 123456');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

seedRealtor();
