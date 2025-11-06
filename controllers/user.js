import prisma from "../prisma/client.js";

const createUser = async (req, res) => {
  try {
    await prisma.user.create({
      data: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        emailAddress: req.body.emailAddress,
        dateOfBirth: new Date(req.body.dateOfBirth),
        password: req.body.password,
        phoneNumber: req.body.phoneNumber,
        role: req.body.role,
      },
    });

    const newUsers = await prisma.user.findMany();

    return res.status(201).json({
      message: "User successfully created",
      data: newUsers,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    // Check if there are no users
    if (!users) {
      return res.status(404).json({ message: "No users found" });
    }

    return res.status(200).json({
      data: users,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    // Check if there is no user with that id
    if (!user) {
      return res.status(404).json({
        message: `No user with the id: ${req.params.id} found`,
      });
    }

    return res.status(200).json({
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    // Find the user by id
    let user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    // Check if there is no user
    if (!user) {
      return res.status(404).json({
        message: `No user with the id: ${req.params.id} found`,
      });
    }

    // Update the user
    user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        emailAddress: req.body.emailAddress,
        dateOfBirth: req.body.dateOfBirth,
        phoneNumber: req.body.phoneNumber,
      },
    });

    return res.status(200).json({
      message: `User with the id: ${req.params.id} successfully updated`,
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return res.status(404).json({
        message: `No user with the id: ${req.params.id} found`,
      });
    }

    await prisma.user.delete({
      where: { id: req.params.id },
    });

    return res.json({
      message: `User with the id: ${req.params.id} successfully deleted`,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

export { createUser, getUsers, getUser, updateUser, deleteUser };
