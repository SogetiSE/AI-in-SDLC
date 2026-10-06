---
name: 'Product Search'
about: 'Seeded feature issue for the Plan and Cloud demos'
title: 'Add product search'
labels:
  - demo
  - feature
---

## Summary

Add product search to the storefront so customers can search across product names and descriptions from the main browsing experience.

## Acceptance Criteria

- Add a search input to the header or primary browsing UI.
- Search must match on product name and description.
- Results update the product grid without breaking category filtering.
- Empty search returns the default product list.
- The implementation includes tests for the API or UI behavior it changes.

## Notes for Demo

- This issue is intended for Demo 6a.
- The live GitHub issue created from this plan is issue #1 in the demo repository.
- A good implementation touches the API route, client query flow, and header or home page UI.
- Keep the experience simple and easy to review in a pull request.
