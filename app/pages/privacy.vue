<template>
  <section class="mx-auto flex max-w-2xl flex-col gap-4">
    <h1 class="vf-page-title">Privacy Policy</h1>
    <p class="text-muted">Draft. Review with counsel before public launch.</p>
    <p>
      The site stores the account details you provide (email, username, profile fields) and the
      content you post. Your birthdate is used once for an age check and is not shown publicly; only
      an adult-or-not flag is kept on your profile.
    </p>
    <p>
      Public profiles, cults, and forum posts are visible to anyone unless you set them otherwise.
      You can opt your profile out of search-engine indexing in your account settings. Private
      messages are visible only to you and the other party.
    </p>
    <p>Media you upload is stored on the site's storage provider and served through its CDN.</p>
  </section>
</template>

<script setup lang="ts">
useHead({ title: "Privacy Policy" })
</script>
