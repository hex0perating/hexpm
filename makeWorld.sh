#!/bin/bash

USERNAME=$_USERNAME
PASSWORD=$_PASSWORD
HOSTNAME=$_HOSTNAME

UEFI_PARTITION=$_UEFI_PARTITION

echo "Creating a new user: $USERNAME"
useradd -m $USERNAME
echo "Assigning password..."
echo "$USERNAME:$PASSWORD" | chpasswd
echo "Creating a new hostname: $HOSTNAME"
echo "$HOSTNAME" > /etc/hostname
echo "Setting up sudoers..."
echo "ALL ALL=(ALL) ALL" >> /etc/sudoers
echo "Building locales..."
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
echo "LANG=en_US.UTF-8" >> /etc/locale.conf
locale-gen
echo "Installing other dependencies..."
pacman -S sddm xorg kitty bspwm networkmanager network-manager-applet grub efibootmgr vim nano neofetch zsh firefox pcmanfm base-devel --noconfirm
echo "Installing build dependencies for hexpm..."
pacman -S nodejs npm git unzip zip --noconfirm
echo "Downloading hexpm..."
git clone https://github.com/hex0perating/hexpm.git /tmp/hexpm 
echo "Installing hexpm..."
cd /tmp/hexpm
npm run install-deno 
npm run compile
mv /tmp/hexpm/hexpm /bin/hexpm
chmod ugo+rx /bin/hexpm
echo "Installing rice..."
sudo -u "$USERNAME" hexpm install rice dontask
echo "Installing remaining dependencies..."
sudo -u "$USERNAME" yay -S visual-studio-code-bin gnome-keyring polkit-gnome --noconfirm
echo "Enabling services..."
systemctl enable sddm
systemctl enable NetworkManager
echo "Mounting /boot/efi..."
mkdir /boot/efi
mount $UEFI_PARTITION /boot/efi
echo "Installing GRUB..."
mkdir /boot/grub 
grub-mkconfig -o /boot/grub/grub.cfg
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=grub --recheck
echo "Done!"
