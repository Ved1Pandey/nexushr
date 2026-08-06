export const getLeaves = async () => {
  const token = sessionStorage.getItem("token");

  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/leaves`,
 {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};