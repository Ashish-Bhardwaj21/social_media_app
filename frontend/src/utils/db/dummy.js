export const POSTS = [
	{
		_id: "1",
		text: "Hello",
		user: {
			username: "ashish",
			profileImg: "/avatar-placeholder.png",
			fullName: "Ashish B",
		},
		comments: [
			{
				_id: "1",
				text: "Nice",
				user: {
					username: "xyz",
					profileImg: "/avatar-placeholder.png",
					fullName: "xyz",
				},
			},
		],
		likes: ["13422234"],
	},
	{
		_id: "2",
		text: "Hey guys",
		img: "/cover.png",
		user: {
			username: "xyz",
			profileImg: "/avatar-placeholder.png",
			fullName: "xyz",
		},
		comments: [
			{
				_id: "2",
				text: "Nice",
				user: {
					username: "pqr",
					profileImg: "/avatar-placeholder.png",
					fullName: "pqr",
				},
			},
		],
		likes: ["2352224"],
	},
	
];

export const USERS_FOR_RIGHT_PANEL = [
	{
		_id: "1",
		fullName: "Abc",
		username: "abc",
		profileImg: "/avatar-placeholder.png",
	},
	{
		_id: "2",
		fullName: "Mna",
		username: "mna",
		profileImg: "/avatar-placeholder.png",
	},
];