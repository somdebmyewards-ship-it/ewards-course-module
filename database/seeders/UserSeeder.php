<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Merchant;
use App\Models\Outlet;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $merchants = Merchant::all();
        $m1 = $merchants->where('name', 'Spice Garden Restaurant')->first();
        $m2 = $merchants->where('name', 'Urban Style Fashion')->first();
        $m3 = $merchants->where('name', 'Glow Beauty Salon')->first();

        $hasOutlets = Schema::hasTable('lms_outlets');
        $m1Outlets = $hasOutlets ? Outlet::where('merchant_id', $m1?->id)->get() : collect();
        $m2Outlets = $hasOutlets ? Outlet::where('merchant_id', $m2?->id)->get() : collect();
        $m3Outlets = $hasOutlets ? Outlet::where('merchant_id', $m3?->id)->get() : collect();

        // ============ ADMIN ============
        User::updateOrCreate(
            ['email' => 'admin@ewards.com'],
            [
                'name' => 'eWards Admin',
                'password' => Hash::make('admin123'),
                'role' => 'ADMIN',
                'designation' => 'Platform Administrator',
                'approved' => true,
                'points' => 420,
            ]
        );

        // ============ TRAINER ============
        User::updateOrCreate(
            ['email' => 'trainer@ewards.com'],
            [
                'name' => 'eWards Trainer',
                'password' => Hash::make('trainer123'),
                'role' => 'TRAINER',
                'designation' => 'Training Manager',
                'approved' => true,
                'points' => 280,
            ]
        );

        // ============ MERCHANT STAFF (CASHIERS) ============
        // Spice Garden - Cashiers
        User::updateOrCreate(
            ['email' => 'priya@spicegarden.com'],
            [
                'name' => 'Priya Sharma',
                'mobile' => '9876543210',
                'password' => Hash::make('demo123'),
                'role' => 'CASHIER',
                'designation' => 'Billing Executive',
                'merchant_id' => $m1?->id,
                'outlet_id' => $m1Outlets->first()?->id,
                'merchant_name_entered' => 'Spice Garden Restaurant',
                'outlet_name_entered' => 'Connaught Place',
                'ewards_reference' => 'eWards Admin',
                'approved' => true,
                'points' => 320,
            ]
        );

        User::updateOrCreate(
            ['email' => 'amit@spicegarden.com'],
            [
                'name' => 'Amit Patel',
                'mobile' => '9876543211',
                'password' => Hash::make('demo123'),
                'role' => 'CASHIER',
                'designation' => 'Billing Executive',
                'merchant_id' => $m1?->id,
                'outlet_id' => $m1Outlets->skip(1)->first()?->id,
                'merchant_name_entered' => 'Spice Garden Restaurant',
                'outlet_name_entered' => 'Saket Mall',
                'ewards_reference' => 'eWards Trainer',
                'approved' => true,
                'points' => 140,
            ]
        );

        // Urban Style - Cashier
        User::updateOrCreate(
            ['email' => 'sneha@urbanstyle.com'],
            [
                'name' => 'Sneha Reddy',
                'mobile' => '9876543212',
                'password' => Hash::make('demo123'),
                'role' => 'CASHIER',
                'designation' => 'Store Associate',
                'merchant_id' => $m2?->id,
                'outlet_id' => $m2Outlets->first()?->id,
                'merchant_name_entered' => 'Urban Style Fashion',
                'outlet_name_entered' => 'DLF Mall',
                'ewards_reference' => 'eWards Admin',
                'approved' => true,
                'points' => 95,
            ]
        );

        // ============ CLIENTS (Brand Owners / Store Managers) ============
        // Spice Garden - Owner
        User::updateOrCreate(
            ['email' => 'rahul@spicegarden.com'],
            [
                'name' => 'Rahul Verma',
                'mobile' => '9876543213',
                'password' => Hash::make('demo123'),
                'role' => 'CLIENT',
                'designation' => 'Brand Owner',
                'merchant_id' => $m1?->id,
                'merchant_name_entered' => 'Spice Garden Restaurant',
                'ewards_reference' => 'eWards Admin',
                'approved' => true,
                'points' => 55,
            ]
        );

        // Urban Style - Marketing Head
        User::updateOrCreate(
            ['email' => 'neha@urbanstyle.com'],
            [
                'name' => 'Neha Gupta',
                'mobile' => '9876543214',
                'password' => Hash::make('demo123'),
                'role' => 'CLIENT',
                'designation' => 'Marketing Head',
                'merchant_id' => $m2?->id,
                'merchant_name_entered' => 'Urban Style Fashion',
                'ewards_reference' => 'eWards Trainer',
                'approved' => true,
                'points' => 210,
            ]
        );

        // Glow Beauty - Store Manager
        User::updateOrCreate(
            ['email' => 'kavita@glowbeauty.com'],
            [
                'name' => 'Kavita Singh',
                'mobile' => '9876543215',
                'password' => Hash::make('demo123'),
                'role' => 'CLIENT',
                'designation' => 'Store Manager',
                'merchant_id' => $m3?->id,
                'outlet_id' => $m3Outlets->first()?->id,
                'merchant_name_entered' => 'Glow Beauty Salon',
                'outlet_name_entered' => 'Rajouri Garden',
                'ewards_reference' => 'eWards Admin',
                'approved' => true,
                'points' => 170,
            ]
        );

        // ============ PENDING APPROVAL USERS ============
        User::updateOrCreate(
            ['email' => 'arjun@newbrand.com'],
            [
                'name' => 'Arjun Mehta',
                'mobile' => '9876543216',
                'password' => Hash::make('demo123'),
                'role' => 'CASHIER',
                'designation' => 'Cashier',
                'merchant_name_entered' => 'New Brand Store',
                'outlet_name_entered' => 'Main Branch',
                'ewards_reference' => 'Rahul Verma',
                'approved' => false,
            ]
        );

        User::updateOrCreate(
            ['email' => 'divya@newcafe.com'],
            [
                'name' => 'Divya Nair',
                'mobile' => '9876543217',
                'password' => Hash::make('demo123'),
                'role' => 'CLIENT',
                'designation' => 'Cafe Owner',
                'merchant_name_entered' => 'Brew House Cafe',
                'outlet_name_entered' => 'Indiranagar',
                'ewards_reference' => 'eWards Admin',
                'approved' => false,
            ]
        );
    }
}
