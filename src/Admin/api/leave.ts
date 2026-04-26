export const getLeaves = async () => {
  const token = sessionStorage.getItem("token");

  const res = await fetch("http://localhost:3001/api/admin/leaves", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};