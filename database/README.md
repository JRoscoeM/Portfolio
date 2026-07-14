# Database Ownership

Database changes must have one migration owner:

- Django migrations own recipe and Django authentication tables.
- Snake control-plane migrations own Snake room, player, and match-history tables.

Hand-written SQL must not redefine tables already managed by Django.
