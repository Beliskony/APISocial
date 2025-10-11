import { z } from 'zod';

// Schéma pour le contenu de la story
const StoryContentSchema = z.object({
    type: z.enum(['image', 'video'], {
        required_error: "Le type de contenu est requis",
        invalid_type_error: "Le type doit être 'image' ou 'video'"
    }),
    data: z.union([
        z.string().url("L'URL du média est invalide"),
        z.instanceof(Buffer).optional() // Pour les uploads de fichiers
    ])
});

// ✅ Schéma pour la création de story
export const CreateStoryZodSchema = z.object({
    body: z.object({
        content: StoryContentSchema.refine(data => {
            if (typeof data.data === 'string') {
                if (data.type === 'image') {
                    return data.data.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                } else if (data.type === 'video') {
                    return data.data.match(/\.(mp4|mov|avi|webm)$/i);
                }
            }
            return true; // Si c'est un Buffer, la validation se fera après
        }, {
            message: "Le format du fichier ne correspond pas au type sélectionné"
        })
    })
});

// ✅ Schéma pour la suppression de story
export const DeleteStoryZodSchema = z.object({
    params: z.object({
        storyId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de story invalide")
    })
});

// ✅ Schéma pour voir une story
export const ViewStoryZodSchema = z.object({
    params: z.object({
        storyId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de story invalide")
    })
});

// ✅ Schéma pour récupérer les stories
export const GetStoriesZodSchema = z.object({
    query: z.object({
        userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID d'utilisateur invalide").optional()
    })
});

// Types TypeScript correspondants
export type CreateStoryValidationType = z.infer<typeof CreateStoryZodSchema>;
export type DeleteStoryValidationType = z.infer<typeof DeleteStoryZodSchema>;
export type ViewStoryValidationType = z.infer<typeof ViewStoryZodSchema>;
export type GetStoriesValidationType = z.infer<typeof GetStoriesZodSchema>;